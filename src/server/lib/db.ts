import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '@/server/models'
import { DATABASE_URL } from '@/server/constants'

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
})
export const db = drizzle(pool, {
  schema,
})
