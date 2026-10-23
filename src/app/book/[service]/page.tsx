import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { hold } from '@/app/actions'
import { SetupNeeded } from '@/components/SetupNeeded'
import { barbers, price, service, SERVICES, TIMEZONE } from '@/lib/shop'
import { formatDay, formatTime, nextDays, restOfDay } from '@/lib/time'
import { configured, shop } from '@/lib/tiempo'

export function generateStaticParams() {
  return SERVICES.map((s) => ({ service: s.slug }))
}

export async function generateMetadata({ params }: PageProps<'/book/[service]'>): Promise<Metadata> {
  const svc = service((await params).service)
  return { title: svc ? `Book a ${svc.name.toLowerCase()}` : 'Book' }
}

export default async function BookPage({ params, searchParams }: PageProps<'/book/[service]'>) {
  const svc = service((await params).service)
  if (!svc) notFound()

  return (
    <>
      <h1>{svc.name}</h1>
      <p className="lede">
        {svc.minutes} minutes, {price(svc.pence)}. <Link href="/">Change service</Link>
      </p>
      <Suspense fallback={<p className="skeleton">Loading times…</p>}>
        <Picker slug={svc.slug} searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Picker({ slug, searchParams }: { slug: string; searchParams: PageProps<'/book/[service]'>['searchParams'] }) {
  const query = await searchParams
  if (!configured()) return <SetupNeeded />
  const days = nextDays(7, TIMEZONE)
  const date = typeof query.date === 'string' && days.includes(query.date) ? query.date : days[0]
  const team = barbers()
  const barber = typeof query.barber === 'string' && team.some((b) => b.id === query.barber) ? query.barber : 'any'
  const href = (d: string, b: string) => `/book/${slug}?date=${d}&barber=${b}`

  return (
    <>
      {query.taken && (
        <div className="notice warn" role="status">
          Someone booked that time a moment before you. Please pick another.
        </div>
      )}
      <h2>Barber</h2>
      <nav className="chips" aria-label="Barber">
        {[{ id: 'any', name: 'Anyone' }, ...team].map((b) => (
          <Link key={b.id} href={href(date, b.id)} className="chip" aria-current={b.id === barber} replace scroll={false}>
            {b.name}
          </Link>
        ))}
      </nav>
      <h2>Day</h2>
      <nav className="chips" aria-label="Day">
        {days.map((d, i) => (
          <Link key={d} href={href(d, barber)} className="chip" aria-current={d === date} replace scroll={false}>
            {i === 0 ? 'Today' : formatDay(d)}
          </Link>
        ))}
      </nav>
      <h2>Time</h2>
      <Suspense key={`${date}-${barber}`} fallback={<p className="skeleton">Loading times…</p>}>
        <Times slug={slug} date={date} barber={barber} />
      </Suspense>
    </>
  )
}

async function Times({ slug, date, barber }: { slug: string; date: string; barber: string }) {
  const svc = service(slug)!
  const resources = barber === 'any' ? barbers().map((b) => b.id) : [barber]
  // Nothing earlier than now: today's search starts from the current minute.
  const window = restOfDay(date, TIMEZONE)
  if (!window) return <p className="muted">No more times today.</p>

  // One segment, any of these barbers. Each slot lists who is free for it; "Anyone" shows a time
  // when at least one is.
  const availability = await shop().availability.search({
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    timezone: TIMEZONE,
    interval_minutes: 15,
    segments: [{ resources, duration_minutes: svc.minutes }],
  })

  if (availability.slots.length === 0) {
    return <p className="muted">Nothing free that day. Try another day or barber.</p>
  }

  return (
    <form action={hold}>
      <input type="hidden" name="service" value={slug} />
      <input type="hidden" name="barber" value={barber} />
      <input type="hidden" name="date" value={date} />
      <div className="times">
        {availability.slots.map((slot) => (
          <button key={slot.start} name="start" value={slot.start}>
            {formatTime(slot.start, TIMEZONE)}
          </button>
        ))}
      </div>
    </form>
  )
}
