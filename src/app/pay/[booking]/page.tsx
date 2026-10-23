import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { fakePay } from '@/app/actions'
import { Countdown } from '@/components/Countdown'
import { SetupNeeded } from '@/components/SetupNeeded'
import { findBooking } from '@/lib/bookings'
import { PAYMENTS } from '@/lib/payments'
import { price, service } from '@/lib/shop'
import { configured } from '@/lib/tiempo'

export const metadata: Metadata = { title: 'Payment', robots: { index: false } }

/**
 * Stands in for a payment provider when STRIPE_SECRET_KEY isn't set. Paying confirms the hold;
 * if the hold has already lapsed, the confirm is refused and nobody is charged for a lost slot.
 */
export default function FakePayPage({ params }: PageProps<'/pay/[booking]'>) {
  return (
    <>
      <h1>Payment</h1>
      <Suspense fallback={<p className="skeleton">Loading…</p>}>
        <FakePay params={params} />
      </Suspense>
    </>
  )
}

async function FakePay({ params }: { params: PageProps<'/pay/[booking]'>['params'] }) {
  if (PAYMENTS !== 'fake') notFound()
  const { booking: id } = await params
  if (!configured()) return <SetupNeeded />
  const booking = await findBooking(id)
  if (booking.status !== 'pending') redirect(`/booking/${booking.id}`)
  const svc = service(String(booking.metadata.service ?? ''))

  return (
    <div className="stack">
      <div className="notice">
        <p>
          <strong>Test payment.</strong> No card needed and no money moves. Add <code>STRIPE_SECRET_KEY</code> to use
          real Stripe Checkout instead.
        </p>
      </div>
      <p>
        Amount: <strong>{svc ? price(svc.pence) : ''}</strong>. Hold ends in <Countdown until={booking.expires_at!} />.
      </p>
      <p className="muted">Wait for the hold to run out before paying to see what happens to a late payment.</p>
      <form action={fakePay}>
        <input type="hidden" name="booking" value={booking.id} />
        <button className="primary">Pay {svc ? price(svc.pence) : ''}</button>
      </form>
    </div>
  )
}
