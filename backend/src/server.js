import 'dotenv/config';
import { pool } from './db.js';
import { createApp } from './app.js';
const port=Number(process.env.PORT||4000);
const app=createApp(pool);
app.listen(port,()=>console.log(`CIMS API running at http://localhost:${port}`));
