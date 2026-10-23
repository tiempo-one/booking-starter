import 'server-only'
import type Stripe from 'stripe'
import { TiempoConflictError } from '@doubletap/tiempo'
import { stripe } from './payments'
import { shop } from './tiempo'

/**
 * Turn a paid Checkout session into a confirmed booking. Called from the Stripe webhook and from
 * the page the customer lands on after paying, whichever gets there first; running it twice is
 * harmless.
 *
 * If the hold ran out before the payment arrived, Tiempo refuses the confirm (409), the slot may
 * already be someone else's, and the customer is refunded. That refusal is the point: the
 * payment never overrides the calendar.
 */
export async function settle(session: Stripe.Checkout.Session): Promise<'confirmed' | 'refunded' | 'unpaid'> {
  const id = session.metadata?.booking_id
  if (!id || session.payment_status !== 'paid') return 'unpaid'

  try {
    await shop().bookings.confirm(id, { idempotencyKey: `confirm-${id}` })
    return 'confirmed'
  } catch (err) {
    if (!(err instanceof TiempoConflictError)) throw err
  }

  // Refused. Either the other caller confirmed it first, or the hold is gone.
  const booking = await shop().bookings.get(id)
  if (booking.status === 'confirmed') return 'confirmed'

  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (paymentIntent) {
    await stripe().refunds.create(
      { payment_intent: paymentIntent, metadata: { booking_id: id, reason: `booking_${booking.status}` } },
      { idempotencyKey: `refund-${session.id}` },
    )
  }
  return 'refunded'
}
