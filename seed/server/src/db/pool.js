import pg from 'pg'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set — database features disabled')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Sensible defaults for a small app
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message)
})

/** Convenience query wrapper */
export async function query(sql, params) {
  const client = await pool.connect()
  try {
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}
