import { constructEvent, TiempoSignatureVerificationError } from '@tiempo/sdk'

/**
 * Tiempo's webhook. The starter only logs events; this is where you'd send the customer their
 * confirmation, or tell them a hold expired. Before doing anything you can't undo, fetch the
 * booking and act on its current status: events can arrive late or out of order.
 *
 * Register https://your-app/api/tiempo/webhook as a webhook endpoint in Tiempo and set
 * TIEMPO_WEBHOOK_SECRET to its tpw_ secret. Reply within 10 seconds; failed deliveries are retried.
 */
export async function POST(request: Request) {
  const secret = process.env.TIEMPO_WEBHOOK_SECRET
  if (!secret) return new Response('TIEMPO_WEBHOOK_SECRET is not set', { status: 500 })

  // The raw body, exactly as sent: the signature covers these bytes.
  const body = await request.text()
  let event
  try {
    event = await constructEvent(body, request.headers.get('tiempo-signature'), secret)
  } catch (err) {
    if (err instanceof TiempoSignatureVerificationError) return new Response('Bad signature', { status: 400 })
    throw err
  }

  switch (event.type) {
    case 'booking.confirmed':
    case 'booking.expired':
    case 'booking.cancelled':
      console.log(`tiempo ${event.id} ${event.type}: ${(event.data.object as { id: string }).id}`)
      break
    default:
      console.log(`tiempo ${event.id} ${event.type}`)
  }
  return Response.json({ received: true })
}
