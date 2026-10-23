// Creates the demo barbershop in your Tiempo test mode: one account, three barbers and their
// hours. Writes TIEMPO_ACCOUNT_ID and TIEMPO_BARBERS to .env.local. Run with: npm run setup
import { appendFileSync } from 'node:fs'
import { Tiempo } from '@doubletap/tiempo'
import { ENV_FILE, loadEnv, testKey } from './env.mjs'

loadEnv()
const tiempo = new Tiempo(testKey(), process.env.TIEMPO_BASE_URL ? { baseUrl: process.env.TIEMPO_BASE_URL } : {})

if (process.env.TIEMPO_ACCOUNT_ID) {
  const account = await tiempo.accounts.get(process.env.TIEMPO_ACCOUNT_ID)
  console.log(`Already set up: ${account.name} (${account.id}). Remove TIEMPO_ACCOUNT_ID from .env.local to start again.`)
  process.exit(0)
}

const TIMEZONE = 'Europe/London'
const days = (names, intervals) => Object.fromEntries(names.map((day) => [day, intervals]))
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

// Different hours on purpose, so "Anyone" finds times a single barber can't.
const BARBERS = [
  { name: 'Ann', week: days([...weekdays, 'saturday'], [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }]) },
  { name: 'Bob', week: days(['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], [{ start: '10:00', end: '19:00' }]) },
  { name: 'Sam', week: days(weekdays, [{ start: '08:00', end: '16:00' }]) },
]

const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date())
const run = crypto.randomUUID()

const account = await tiempo.accounts.create(
  { name: 'Fade & Co', timezone: TIMEZONE, metadata: { created_by: 'booking-starter' } },
  { idempotencyKey: `setup-${run}-account` },
)
const shop = tiempo.withAccount(account.id)
console.log(`Created account ${account.name} (${account.id})`)

const created = []
for (const barber of BARBERS) {
  const resource = await shop.resources.create(
    { name: barber.name, type: 'barber' },
    { idempotencyKey: `setup-${run}-${barber.name}` },
  )
  await shop.schedules.create(
    { resource: resource.id, effective_from: today, weeks: [barber.week] },
    { idempotencyKey: `setup-${run}-${barber.name}-schedule` },
  )
  created.push(`${resource.id}:${barber.name}`)
  console.log(`Created ${barber.name} (${resource.id}) with weekly hours`)
}

appendFileSync(ENV_FILE, `\nTIEMPO_ACCOUNT_ID=${account.id}\nTIEMPO_BARBERS=${created.join(',')}\n`)
console.log('\nWrote TIEMPO_ACCOUNT_ID and TIEMPO_BARBERS to .env.local. Start the app with: npm run dev')
