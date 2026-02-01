import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Force IPv4 to avoid ENETUNREACH errors on Render (IPv6 not supported)
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

export const query = (text, params) => pool.query(text, params);
export default pool;
