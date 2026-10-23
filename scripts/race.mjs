// The double-booking test: 20 customers try to hold the same barber at the same time, all at
// once. Exactly one should get it; the other 19 get a 409. Then the hold is cancelled again.
// Run with: npm run race (after npm run setup)
import { Tiempo, TiempoConflictError } from '@doubletap/tiempo'
import { loadEnv, testKey } from './env.mjs'

loadEnv()
const CUSTOMERS = 20
const tiempo = new Tiempo(testKey(), process.env.TIEMPO_BASE_URL ? { baseUrl: process.env.TIEMPO_BASE_URL } : {})
const account = process.env.TIEMPO_ACCOUNT_ID
const barber = (process.env.TIEMPO_BARBERS ?? '').split(',')[0]?.split(':')[0]
if (!account || !barber) {
  console.error('Run npm run setup first.')
  process.exit(1)
}
const shop = tiempo.withAccount(account)

// The first free 30 minutes in the next week.
const now = new Date()
const { slots } = await shop.availability.search({
  from: now.toISOString(),
  to: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
  interval_minutes: 15,
  segments: [{ resources: [barber], duration_minutes: 30 }],
})
if (slots.length === 0) {
  console.error('No free time in the next week to race for.')
  process.exit(1)
}
const { start, end } = slots[0]
console.log(`${CUSTOMERS} customers racing for ${start}...`)

const results = await Promise.allSettled(
  Array.from({ length: CUSTOMERS }, () =>
    shop.bookings.create(
      {
        segments: [{ resource: barber, start, end }],
        expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
        metadata: { source: 'race-test' },
      },
      { maxRetries: 0 },
    ),
  ),
)

const won = results.filter((r) => r.status === 'fulfilled')
const refused = results.filter((r) => r.status === 'rejected' && r.reason instanceof TiempoConflictError)
const other = results.filter((r) => r.status === 'rejected' && !(r.reason instanceof TiempoConflictError))
console.log(`Held: ${won.length}. Refused with 409: ${refused.length}. Other errors: ${other.length}.`)
for (const r of other) console.error(r.reason)

for (const r of won) await shop.bookings.cancel(r.value.id, { reason: 'race_test' })

if (won.length === 1 && refused.length === CUSTOMERS - 1) {
  console.log('Pass: one booking, no double-booking.')
} else {
  console.error('Fail: expected exactly one hold.')
  process.exit(1)
}
