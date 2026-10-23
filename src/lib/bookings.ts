import 'server-only'
import { notFound } from 'next/navigation'
import { TiempoError } from '@doubletap/tiempo'
import { shop } from './tiempo'

/** A booking by id, or the 404 page for an id Tiempo doesn't know. */
export async function findBooking(id: string) {
  try {
    return await shop().bookings.get(id)
  } catch (err) {
    if (err instanceof TiempoError && err.statusCode === 404) notFound()
    throw err
  }
}
