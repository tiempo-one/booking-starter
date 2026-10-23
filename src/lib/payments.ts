import 'server-only'
import Stripe from 'stripe'

/**
 * How customers pay. With STRIPE_SECRET_KEY set, real Stripe Checkout (use a test key while you
 * build); without it, a built-in fake payment page, so the starter runs with a Tiempo key alone.
 */
export const PAYMENTS: 'stripe' | 'fake' = process.env.STRIPE_SECRET_KEY ? 'stripe' : 'fake'

/**
 * How long a slot is held while the customer pays. It has to outlast the payment step, or a
 * customer could pay for a slot someone else has just booked: Stripe Checkout sessions last at
 * least 30 minutes, so with Stripe the hold is 35.
 */
export const HOLD_MINUTES = PAYMENTS === 'stripe' ? 35 : 10
export const CHECKOUT_MINUTES = 30

let client: Stripe | undefined

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set.')
    client = new Stripe(key)
  }
  return client
}

/** Where to send people back to: APP_URL, or the deployment's own URL on Vercel. */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}
