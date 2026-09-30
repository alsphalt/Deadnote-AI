import { Pool } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

export async function migrate() {
  if (!pool) return;
  const file = path.resolve(process.cwd(), '../../db/001_initial.sql');
  const sql = await fs.readFile(file, 'utf8');
  await pool.query(sql);
}
