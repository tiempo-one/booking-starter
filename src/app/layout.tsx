import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { SHOP_NAME } from '@/lib/shop'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: `${SHOP_NAME} | Book a cut`, template: `%s | ${SHOP_NAME}` },
  description: `Book a cut at ${SHOP_NAME}. A demo barbershop built on the Tiempo scheduling API.`,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-GB" className={geist.variable}>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            {SHOP_NAME}
          </Link>
          <span className="demo-tag">Demo shop</span>
        </header>
        <main className="page">{children}</main>
        <footer className="site-footer">
          Bookings by{' '}
          <a href="https://tiempo.one" rel="noopener">
            Tiempo
          </a>
          . The code for this shop is on{' '}
          <a href="https://github.com/tiempo-one/booking-starter" rel="noopener">
            GitHub
          </a>
          .
        </footer>
      </body>
    </html>
  )
}
