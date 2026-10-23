import 'server-only'
import { Tiempo } from '@tiempo/sdk'

let client: Tiempo | undefined

/** The platform's Tiempo client. Only ever on the server: the key must never reach a browser. */
export function tiempo(): Tiempo {
  if (!client) {
    const key = process.env.TIEMPO_API_KEY
    if (!key) throw new Error('TIEMPO_API_KEY is not set. Copy .env.example to .env.local and run npm run setup.')
    client = new Tiempo(key, process.env.TIEMPO_BASE_URL ? { baseUrl: process.env.TIEMPO_BASE_URL } : {})
  }
  return client
}

/** The client acting for the barbershop (Tiempo-Account), which npm run setup created. */
export function shop() {
  const account = process.env.TIEMPO_ACCOUNT_ID
  if (!account) throw new Error('TIEMPO_ACCOUNT_ID is not set. Run npm run setup.')
  return tiempo().withAccount(account)
}

/** Whether the starter has been set up yet, so pages can say what to run instead of failing. */
export function configured(): boolean {
  return Boolean(process.env.TIEMPO_API_KEY && process.env.TIEMPO_ACCOUNT_ID && process.env.TIEMPO_BARBERS)
}
