import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { inquirySchema, statusSchema, isAllowedTransition, parseId, validationDetails } from './policy.js';

const AUTH_COOKIE = 'cims_session';
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) }).strict();
export function createApp(pool, config = process.env) {
 if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
 const app = express();
 app.use(helmet());
 app.use(cors({ origin: config.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
 app.use(express.json({ limit: '20kb' }));
 app.use(cookieParser());
 const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: config.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 * 1000 };
 const sendError=(res,status,code,message,details)=>res.status(status).json({error:{code,message,...(details?{details}:{})}});
 const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
 function auth(req,res,next) {
  try { const token = req.cookies[AUTH_COOKIE]; if (!token) return sendError(res,401,'UNAUTHENTICATED','Please sign in.');
   const claims=jwt.verify(token,config.JWT_SECRET,{algorithms:['HS256']});
   if (!Number.isSafeInteger(claims.userId)) return sendError(res,401,'UNAUTHENTICATED','Invalid session.');
   req.userId=claims.userId; return next();
  } catch { return sendError(res,401,'UNAUTHENTICATED','Session expired or invalid.'); }
 }
 const loginLimit=rateLimit({ windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Too many login attempts. Try again later.'}} });
 app.post('/api/auth/login',loginLimit,asyncRoute(async(req,res)=>{
  const parsed=loginSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res,400,'VALIDATION','Enter a valid email and password.',validationDetails(parsed.error));
  const {rows}=await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1',[parsed.data.email.toLowerCase()]);
  const user=rows[0]; if (!user || !(await bcrypt.compare(parsed.data.password,user.password_hash))) return sendError(res,401,'BAD_CREDENTIALS','Incorrect email or password.');
  const token=jwt.sign({userId:user.id},config.JWT_SECRET,{algorithm:'HS256',expiresIn:'8h'});
  res.cookie(AUTH_COOKIE,token,cookieOptions).json({user:{id:user.id,name:user.name,email:user.email}});
 }));
 app.post('/api/auth/logout',(_req,res)=>res.clearCookie(AUTH_COOKIE,{path:'/',httpOnly:true,sameSite:'lax',secure:cookieOptions.secure}).json({ok:true}));
 app.get('/api/auth/me',auth,asyncRoute(async(req,res)=>{
  const {rows}=await pool.query('SELECT id,name,email FROM users WHERE id=$1',[req.userId]);
  if (!rows[0]) return sendError(res,401,'UNAUTHENTICATED','Account not found.');
  res.json({user:rows[0]});
 }));
 app.get('/api/inquiries',auth,asyncRoute(async(req,res)=>{
  const search=typeof req.query.search==='string'?req.query.search.trim().slice(0,100):'';
  const status=typeof req.query.status==='string'?req.query.status:'';
  if(status && !['New','In Progress','Resolved'].includes(status)) return sendError(res,400,'VALIDATION','Invalid status filter.');
  const {rows}=await pool.query(`SELECT id,customer_name,contact_details,subject,description,status,version,created_at,updated_at FROM inquiries WHERE created_by=$1 AND ($2::text='' OR status=$2) AND ($3::text='' OR customer_name ILIKE '%'||$3||'%' OR subject ILIKE '%'||$3||'%' OR contact_details ILIKE '%'||$3||'%') ORDER BY updated_at DESC, id DESC LIMIT 200`,[req.userId,status,search]);
  res.json({inquiries:rows});
 }));
 app.post('/api/inquiries',auth,asyncRoute(async(req,res)=>{
  const parsed=inquirySchema.safeParse(req.body);
  if(!parsed.success) return sendError(res,400,'VALIDATION','Please correct the highlighted fields.',validationDetails(parsed.error));
  const v=parsed.data;
  const {rows}=await pool.query('INSERT INTO inquiries (created_by,customer_name,contact_details,subject,description) VALUES ($1,$2,$3,$4,$5) RETURNING *',[req.userId,v.customer_name,v.contact_details,v.subject,v.description]);
  res.status(201).json({inquiry:rows[0]});
 }));
 app.get('/api/inquiries/:id',auth,asyncRoute(async(req,res)=>{
  const id=parseId(req.params.id); if(!id) return sendError(res,400,'INVALID_ID','Invalid inquiry ID.');
  const {rows}=await pool.query('SELECT id,customer_name,contact_details,subject,description,status,version,created_at,updated_at FROM inquiries WHERE id=$1 AND created_by=$2',[id,req.userId]);
  if(!rows[0]) return sendError(res,404,'NOT_FOUND','Inquiry not found.');
  res.json({inquiry:rows[0]});
 }));
 app.patch('/api/inquiries/:id/status',auth,asyncRoute(async(req,res)=>{
  const id=parseId(req.params.id); if(!id) return sendError(res,400,'INVALID_ID','Invalid inquiry ID.');
  const parsed=statusSchema.safeParse(req.body); if(!parsed.success) return sendError(res,400,'VALIDATION','Invalid status or version.',validationDetails(parsed.error));
  const client=await pool.connect();
  try {
   await client.query('BEGIN');
   const result=await client.query('SELECT status,version FROM inquiries WHERE id=$1 AND created_by=$2 FOR UPDATE',[id,req.userId]);
   const record=result.rows[0];
   if(!record){await client.query('ROLLBACK');return sendError(res,404,'NOT_FOUND','Inquiry not found.');}
   if(record.version!==parsed.data.version){await client.query('ROLLBACK');return sendError(res,409,'STALE_DATA','This inquiry changed in another tab. Refresh and try again.');}
   if(!isAllowedTransition(record.status,parsed.data.status)){await client.query('ROLLBACK');return sendError(res,422,'INVALID_TRANSITION',`Cannot change status from ${record.status} to ${parsed.data.status}.`);}
   const updated=await client.query('UPDATE inquiries SET status=$1,version=version+1,updated_at=now() WHERE id=$2 AND created_by=$3 RETURNING id,customer_name,contact_details,subject,description,status,version,created_at,updated_at',[parsed.data.status,id,req.userId]);
   await client.query('COMMIT');res.json({inquiry:updated.rows[0]});
  }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
 }));
 app.use('/api',(_req,res)=>sendError(res,404,'NOT_FOUND','API endpoint not found.'));
 app.use((err,_req,res,_next)=>{console.error(err);sendError(res,500,'SERVER_ERROR','Something went wrong. Please try again.');});
 return app;
}
