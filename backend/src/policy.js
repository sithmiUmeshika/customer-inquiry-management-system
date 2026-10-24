import { z } from 'zod';
export const inquirySchema = z.object({
 customer_name: z.string().trim().min(2).max(120),
 contact_details: z.string().trim().min(5).max(200),
 subject: z.string().trim().min(3).max(160),
 description: z.string().trim().min(10).max(2000)
}).strict();
export const statusSchema = z.object({ status: z.enum(['New','In Progress','Resolved']), version: z.number().int().positive() }).strict();
const allowed = { 'New': ['In Progress'], 'In Progress': ['Resolved'], 'Resolved': [] };
export function isAllowedTransition(from, to) { return (allowed[from] || []).includes(to); }
export function parseId(value) { const n=Number(value); return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(n) ? n : null; }
export function validationDetails(error) { return error.flatten().fieldErrors; }
