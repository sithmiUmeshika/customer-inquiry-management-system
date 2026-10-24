import pg from 'pg';
import 'dotenv/config';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Copy backend/.env.example to backend/.env');
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
