'use client'

import { useEffect, useState } from 'react'

/** How long the hold has left, ticking down. Tiempo releases the slot itself when it reaches zero. */
export function Countdown({ until }: { until: string }) {
  const end = new Date(until).getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  if (now === null) return <span>a few minutes</span>
  const left = Math.max(0, Math.round((end - now) / 1000))
  if (left === 0) return <span>no time</span>
  const minutes = Math.floor(left / 60)
  const seconds = String(left % 60).padStart(2, '0')
  return (
    <span role="timer" aria-live="off">
      {minutes}:{seconds}
    </span>
  )
}
