/**
 * Dates in the shop's timezone. Tiempo takes instants (UTC), so "Saturday in London" has to become
 * the right two instants, including on the days the clocks change.
 */

/** The UTC offset in minutes of a timezone at an instant (60 for London in summer). */
function offsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - at.getTime()) / 60000)
}

/** The instant a local wall-clock time happens in a timezone ("2026-10-25", "00:00", London). */
export function localToInstant(date: string, time: string, timeZone: string): Date {
  const naive = new Date(`${date}T${time}:00Z`)
  // Two passes settle the offset either side of a clock change.
  let guess = new Date(naive.getTime() - offsetMinutes(naive, timeZone) * 60000)
  guess = new Date(naive.getTime() - offsetMinutes(guess, timeZone) * 60000)
  return guess
}

/** The start and end of a local day as instants: 25 hours long when the clocks go back. */
export function localDay(date: string, timeZone: string): { from: Date; to: Date } {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return { from: localToInstant(date, '00:00', timeZone), to: localToInstant(next.toISOString().slice(0, 10), '00:00', timeZone) }
}

/** Today's date in a timezone, as YYYY-MM-DD. */
export function today(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** The next n local dates from today, as YYYY-MM-DD. */
export function nextDays(n: number, timeZone: string, now = new Date()): string[] {
  const start = new Date(`${today(timeZone, now)}T12:00:00Z`)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  )
}

export function formatWhen(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** What's left of a local day: from now (or its start, if later) to its end. Null once it's over. */
export function restOfDay(date: string, timeZone: string, now = new Date()): { from: Date; to: Date } | null {
  const day = localDay(date, timeZone)
  const from = new Date(Math.max(day.from.getTime(), now.getTime()))
  return from < day.to ? { from, to: day.to } : null
}
