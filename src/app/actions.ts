'use server'

import { TiempoConflictError } from '@doubletap/tiempo'
import { redirect } from 'next/navigation'
import { barbers, SHOP_NAME, service as findService } from '@/lib/shop'
import { appUrl, CHECKOUT_MINUTES, HOLD_MINUTES, PAYMENTS, stripe } from '@/lib/payments'
import { shop } from '@/lib/tiempo'

/**
 * Hold a time for the customer while they pay. The hold is a real booking in Tiempo, status
 * "pending", that expires on its own: nobody else can take the slot until it does, and if the
 * customer walks away it frees itself. Two customers on the same slot at once get one hold and
 * one 409, however close together they tap.
 */
export async function hold(formData: FormData) {
  const svc = findService(String(formData.get('service')))
  const start = new Date(String(formData.get('start')))
  const barber = String(formData.get('barber') ?? 'any')
  const date = String(formData.get('date') ?? '')
  if (!svc || Number.isNaN(start.getTime())) redirect('/')

  const end = new Date(start.getTime() + svc.minutes * 60_000)
  // "Anyone": every barber as a candidate, in order. Tiempo books the first who is free, in the
  // same step that checks, so two customers can't both be given Sam.
  const resources = barber === 'any' ? barbers().map((b) => b.id) : [barber]

  let bookingId: string
  try {
    const booking = await shop().bookings.create({
      segments: [{ resources, start: start.toISOString(), end: end.toISOString() }],
      expires_at: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
      metadata: { service: svc.slug },
    })
    bookingId = booking.id
  } catch (err) {
    if (err instanceof TiempoConflictError) {
      redirect(`/book/${svc.slug}?date=${date}&barber=${barber}&taken=1`)
    }
    throw err
  }
  redirect(`/checkout/${bookingId}`)
}

/**
 * Take the customer to payment. Only a first name is kept on the booking: in your own app,
 * customer details belong in your database, with just your own id in Tiempo's metadata.
 */
export async function pay(formData: FormData) {
  const id = String(formData.get('booking'))
  const firstName = String(formData.get('first_name') ?? '').trim().slice(0, 40)
  const booking = await shop().bookings.get(id)
  if (booking.status !== 'pending') redirect(`/booking/${id}`)
  const svc = findService(booking.metadata?.service ?? '')
  if (!svc) redirect('/')

  if (firstName) await shop().bookings.update(id, { metadata: { customer_first_name: firstName } })
  if (PAYMENTS === 'fake') redirect(`/pay/${id}`)

  // The Checkout session ends before the hold does (30 minutes against 35), so a customer can
  // never finish paying for a slot that has already been released.
  const session = await stripe().checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: svc.pence,
            product_data: { name: `${svc.name} at ${SHOP_NAME}` },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60,
      client_reference_id: id,
      metadata: { booking_id: id },
      payment_intent_data: { metadata: { booking_id: id } },
      success_url: `${appUrl()}/booking/${id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/checkout/${id}`,
    },
    { idempotencyKey: `checkout-${id}` },
  )
  redirect(session.url ?? `/checkout/${id}`)
}

/** The fake payment step's "Pay": confirm the hold. A hold that has lapsed is refused. */
export async function fakePay(formData: FormData) {
  const id = String(formData.get('booking'))
  try {
    await shop().bookings.confirm(id, { idempotencyKey: `confirm-${id}` })
  } catch (err) {
    if (!(err instanceof TiempoConflictError)) throw err
    // Too late: the hold expired (or was cancelled). The booking page says so.
  }
  redirect(`/booking/${id}`)
}

/** "Changed my mind": release the slot straight away rather than waiting for the hold to lapse. */
export async function abandon(formData: FormData) {
  const id = String(formData.get('booking'))
  try {
    await shop().bookings.cancel(id, { reason: 'customer_abandoned' })
  } catch (err) {
    if (!(err instanceof TiempoConflictError)) throw err
  }
  redirect('/')
}
