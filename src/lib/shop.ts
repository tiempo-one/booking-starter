/**
 * The barbershop itself. Services and prices live in your app, not in Tiempo: Tiempo only needs
 * to know how long something takes and who can do it.
 */
export const SHOP_NAME = 'Fade & Co'
export const TIMEZONE = 'Europe/London'

export type Service = { slug: string; name: string; minutes: number; pence: number; blurb: string }

export const SERVICES: Service[] = [
  { slug: 'skin-fade', name: 'Skin fade', minutes: 30, pence: 2500, blurb: 'Clippers down to the skin, blended up.' },
  { slug: 'cut-and-beard', name: 'Cut and beard', minutes: 45, pence: 3500, blurb: 'A full cut, then the beard shaped and lined up.' },
  { slug: 'beard-trim', name: 'Beard trim', minutes: 15, pence: 1500, blurb: 'Shaped, trimmed and lined up.' },
]

export function service(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug)
}

export type Barber = { id: string; name: string }

/** The barbers npm run setup created, from TIEMPO_BARBERS ("res_…:Ann,res_…:Bob"). */
export function barbers(): Barber[] {
  return (process.env.TIEMPO_BARBERS ?? '')
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [id, name] = pair.split(':')
      return { id, name: name ?? id }
    })
}

export function barberName(id: string | undefined): string {
  return barbers().find((b) => b.id === id)?.name ?? 'Your barber'
}

export function price(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
