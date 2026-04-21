import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf-8')
  .split('\n')
  .filter(Boolean)
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=')
    if (k && v.length) acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const sql = neon(env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    anthropic_api_key TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`

console.log('user_settings table created (or already exists)')
process.exit(0)
