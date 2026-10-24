import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
const accounts=[['Asha Staff','staff@123.local','system123!'],['Ravi Staff','ravi@demo.local','DemoPass123!']];
try { for(const [name,email,password] of accounts) {
 const hash=await bcrypt.hash(password,12);
 await pool.query('INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING',[name,email,hash]);
 console.log('Seeded (if absent):',email);
}}finally{await pool.end();}
