import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SetupNeeded } from '@/components/SetupNeeded'
import { findBooking } from '@/lib/bookings'
import { settle } from '@/lib/checkout'
import { PAYMENTS, stripe } from '@/lib/payments'
import { barberName, service, TIMEZONE } from '@/lib/shop'
import { formatWhen } from '@/lib/time'
import { configured } from '@/lib/tiempo'

export const metadata: Metadata = { title: 'Booking', robots: { index: false } }

export default function BookingPage({ params, searchParams }: PageProps<'/booking/[booking]'>) {
  return (
    <Suspense fallback={<p className="skeleton">Loading your booking…</p>}>
      <Status params={params} searchParams={searchParams} />
    </Suspense>
  )
}

type Props = PageProps<'/booking/[booking]'>

async function Status({ params, searchParams }: { params: Props['params']; searchParams: Props['searchParams'] }) {
  const id = (await params).booking
  const { session_id: sessionId } = await searchParams
  if (!configured()) return <SetupNeeded />
  // Back from Stripe: settle the payment now rather than waiting for the webhook, so the
  // customer sees their booking straight away (and local development works without the
  // Stripe CLI forwarding webhooks).
  if (PAYMENTS === 'stripe' && typeof sessionId === 'string' && sessionId.startsWith('cs_')) {
    const session = await stripe().checkout.sessions.retrieve(sessionId)
    if (session.metadata?.booking_id === id) await settle(session)
  }
  const booking = await findBooking(id)
  const svc = service(String(booking.metadata.service ?? ''))
  const name = booking.metadata.customer_first_name
  const when = formatWhen(booking.start, TIMEZONE)
  const barber = barberName(booking.segments[0]?.resource)

  switch (booking.status) {
    case 'confirmed':
    case 'completed':
      return (
        <>
          <h1>You&apos;re booked{name ? `, ${name}` : ''}</h1>
          <p className="lede">
            {svc?.name} with {barber}, {when}.
          </p>
          <Link href="/" className="button">
            Back to the shop
          </Link>
        </>
      )
    case 'pending':
      return (
        <>
          <h1>Not paid yet</h1>
          <p className="lede">
            {svc?.name} with {barber}, {when}. The time is still held for you, but the booking isn&apos;t confirmed
            until payment goes through.
          </p>
          <Link href={`/checkout/${booking.id}`} className="button">
            Finish booking
          </Link>
        </>
      )
    case 'expired':
      return (
        <>
          <h1>That hold ran out</h1>
          <p className="lede">
            The time was released before payment finished. If you were charged, the payment is refunded automatically.
          </p>
          <Link href="/" className="button">
            Pick another time
          </Link>
        </>
      )
    default:
      return (
        <>
          <h1>Booking cancelled</h1>
          <p className="lede">
            {svc?.name} with {barber}, {when}, is cancelled.
          </p>
          <Link href="/" className="button">
            Book again
          </Link>
        </>
      )
  }
}
