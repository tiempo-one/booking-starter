import type Stripe from 'stripe'
import { settle } from '@/lib/checkout'
import { stripe } from '@/lib/payments'

/**
 * Stripe's webhook: checkout.session.completed confirms the booking (or refunds it, if the hold
 * ran out first). The success page does the same when the customer lands on it; this catches the
 * customers who close the tab before getting there.
 *
 * Point a Stripe webhook endpoint at /api/stripe/webhook for checkout.session.completed and
 * checkout.session.async_payment_succeeded, and set STRIPE_WEBHOOK_SECRET to its whsec_ secret.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('STRIPE_WEBHOOK_SECRET is not set', { status: 500 })

  const body = await request.text()
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(body, request.headers.get('stripe-signature') ?? '', secret)
  } catch {
    return new Response('Bad signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const outcome = await settle(event.data.object)
    console.log(`stripe ${event.id} ${event.type}: booking ${event.data.object.metadata?.booking_id} ${outcome}`)
  }
  return Response.json({ received: true })
}
