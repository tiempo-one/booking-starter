import { existsSync, readFileSync } from 'node:fs'

export const ENV_FILE = new URL('../.env.local', import.meta.url)

/** Loads .env.local into process.env (without overriding what's already set). */
export function loadEnv() {
  if (!existsSync(ENV_FILE)) return
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

/** The Tiempo key, refusing a live one: the scripts create and delete data. */
export function testKey() {
  const key = process.env.TIEMPO_API_KEY
  if (!key) {
    console.error('TIEMPO_API_KEY is not set. Copy .env.example to .env.local and add your test key.')
    process.exit(1)
  }
  if (!key.startsWith('tpt_')) {
    console.error('TIEMPO_API_KEY must be a test key (tpt_...). These scripts only run in test mode.')
    process.exit(1)
  }
  return key
}
