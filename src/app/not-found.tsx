import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p className="lede">That page or booking doesn&apos;t exist.</p>
      <Link href="/" className="button">
        Back to the shop
      </Link>
    </>
  )
}
