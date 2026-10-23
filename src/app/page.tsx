import Link from 'next/link'
import { price, SERVICES, SHOP_NAME } from '@/lib/shop'

export default function Home() {
  return (
    <>
      <h1>{SHOP_NAME}</h1>
      <p className="lede">Three barbers, six days a week. Pick a service to see who&apos;s free.</p>
      <ul className="services">
        {SERVICES.map((s) => (
          <li key={s.slug}>
            <Link href={`/book/${s.slug}`} className="card service">
              <div>
                <h2>{s.name}</h2>
                <p>
                  {s.blurb} {s.minutes} minutes.
                </p>
              </div>
              <span className="service-price">{price(s.pence)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
