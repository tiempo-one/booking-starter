import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { abandon, pay } from '@/app/actions'
import { Countdown } from '@/components/Countdown'
import { SetupNeeded } from '@/components/SetupNeeded'
import { findBooking } from '@/lib/bookings'
import { PAYMENTS } from '@/lib/payments'
import { barberName, price, service, TIMEZONE } from '@/lib/shop'
import { formatWhen } from '@/lib/time'
import { configured } from '@/lib/tiempo'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage({ params }: PageProps<'/checkout/[booking]'>) {
  return (
    <>
      <h1>Your booking</h1>
      <Suspense fallback={<p className="skeleton">Loading your booking…</p>}>
        <Checkout params={params} />
      </Suspense>
    </>
  )
}

async function Checkout({ params }: { params: PageProps<'/checkout/[booking]'>['params'] }) {
  const { booking: id } = await params
  if (!configured()) return <SetupNeeded />
  const booking = await findBooking(id)
  if (booking.status !== 'pending') redirect(`/booking/${booking.id}`)
  const svc = service(String(booking.metadata.service ?? ''))
  const segment = booking.segments[0]

  return (
    <div className="stack">
      <p className="lede">
        We&apos;re holding this time for you for <Countdown until={booking.expires_at!} />. Nobody else can book it
        while you pay.
      </p>
      <dl className="card summary">
        <dt>Service</dt>
        <dd>{svc?.name}</dd>
        <dt>When</dt>
        <dd>{formatWhen(booking.start, TIMEZONE)}</dd>
        <dt>Barber</dt>
        <dd>{barberName(segment?.resource)}</dd>
        <dt>Price</dt>
        <dd>{svc ? price(svc.pence) : ''}</dd>
      </dl>
      <form action={pay} className="stack">
        <input type="hidden" name="booking" value={booking.id} />
        <label>
          First name
          <input name="first_name" autoComplete="given-name" maxLength={40} required />
        </label>
        <div className="actions">
          <button className="primary">{PAYMENTS === 'stripe' ? 'Pay with card' : 'Continue to payment'}</button>
        </div>
      </form>
      <form action={abandon}>
        <input type="hidden" name="booking" value={booking.id} />
        <button className="link-button">Cancel and release this time</button>
      </form>
    </div>
  )
}
