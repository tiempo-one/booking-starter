# Tiempo booking starter

A small barbershop booking app built on Next.js and [Tiempo](https://tiempo.one), the scheduling
API. Customers pick a service, a barber (or anyone) and a time, the slot is held while they pay,
and it can't be double-booked, however many people tap the same time at once.

Use it as a working reference, or fork it as the start of your own booking platform.

- Live availability from three barbers with different hours, in the shop's timezone
- "Anyone" bookings that go to the first free barber, decided by Tiempo, not by your code
- Holds that expire on their own if the customer walks away
- Payment with Stripe Checkout, or a built-in test payment page if you don't have Stripe keys
- Automatic refunds when a payment lands after the hold ran out
- A race test: 20 customers, one slot, one booking

## Quick start

You need Node 20.9 or later and a Tiempo test key (`tpt_...`). [Sign up](https://tiempo.one/signup)
and copy one from the dashboard; test mode is free.

```bash
git clone https://github.com/tiempo-one/booking-starter.git
cd booking-starter
npm install
cp .env.example .env.local
```

Put your test key in `.env.local` as `TIEMPO_API_KEY`, then:

```bash
npm run setup
npm run dev
```

`npm run setup` creates the shop in your Tiempo test mode (an account, three barbers and their
weekly hours) and writes the ids to `.env.local`. Open http://localhost:3000 and book a cut.

With no Stripe keys, payment is a test page: press Pay and the booking is confirmed. Wait for the
hold to run out before pressing it to see a late payment refused.

## Taking real payments with Stripe

Add your own Stripe keys to `.env.local` and the app switches to Stripe Checkout:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Locally, forward Stripe's webhooks with the [Stripe CLI](https://docs.stripe.com/stripe-cli),
which prints the `whsec_` secret to use:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,checkout.session.async_payment_succeeded
```

In production, add a webhook endpoint for those two events in the Stripe dashboard, pointing at
`https://your-app/api/stripe/webhook`.

The booking is confirmed by whichever arrives first: the customer landing back on the booking
page, or the webhook. If the customer closes the tab after paying, the webhook still confirms it.

## How it works

| Step | Code | Tiempo call |
|---|---|---|
| Show free times | `src/app/book/[service]/page.tsx` | `availability.search` |
| Hold a time | `hold` in `src/app/actions.ts` | `bookings.create` with `expires_at` |
| Pay | `pay` in `src/app/actions.ts` | `bookings.update` (first name only) |
| Confirm after payment | `src/lib/checkout.ts` | `bookings.confirm` |
| Customer changes their mind | `abandon` in `src/app/actions.ts` | `bookings.cancel` |
| Hear about changes | `src/app/api/tiempo/webhook/route.ts` | signed webhooks |

**Nobody checks availability before booking.** The app searches to show times, but when a
customer picks one it simply creates the booking. If someone else got there first, Tiempo answers
409 and the customer is shown other times. Checking first and then booking leaves a gap between
the two in which someone else can book, which is how most booking apps end up double-booking.

**The hold outlasts the payment.** A Stripe Checkout session lasts at least 30 minutes, so with
Stripe the hold is 35 (`HOLD_MINUTES` in `src/lib/payments.ts`) and the session is set to end at
30. A customer can't finish paying for a time that has already been released.

**A late payment is refunded, not forced through.** If the confirm is refused because the hold
expired, the slot may already belong to someone else. The app refunds the payment and tells the
customer, rather than creating a second booking on top.

**Times are in the shop's timezone.** Tiempo takes UTC instants. `src/lib/time.ts` turns "Sunday
in London" into the right two instants, including the 23 and 25 hour days when the clocks change.

## The race test

```bash
npm run race
```

Sends 20 holds for the same barber and time at once. Expect one success and nineteen 409s:

```
20 customers racing for 2026-10-26T08:00:00Z...
Held: 1. Refused with 409: 19. Other errors: 0.
Pass: one booking, no double-booking.
```

The test cancels its hold afterwards.

## Tiempo webhooks

To receive Tiempo's events, register `https://your-app/api/tiempo/webhook` as a
[webhook endpoint](https://tiempo.one/docs/webhook-endpoints) and set `TIEMPO_WEBHOOK_SECRET` to
its `tpw_` secret. The starter verifies and logs each event; that handler is where you'd send
confirmation emails or texts.

## Customer details

This starter keeps only the customer's first name, in the booking's metadata, so the confirmation
page can greet them. In your own app, keep customer details in your own database and put just your
customer id in Tiempo's metadata.

## Deploying

Deploy to [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/tiempo-one/booking-starter&env=TIEMPO_API_KEY,TIEMPO_ACCOUNT_ID,TIEMPO_BARBERS&envDescription=Run%20npm%20run%20setup%20locally%20first%2C%20then%20copy%20these%20from%20.env.local)
or anywhere that runs Next.js. Run `npm run setup` locally first and copy `TIEMPO_API_KEY`,
`TIEMPO_ACCOUNT_ID` and `TIEMPO_BARBERS` from `.env.local` into the host's environment variables,
plus the Stripe ones if you use Stripe.

Going live with real customers means a live Tiempo key and running setup again in live mode. See
[Going live](https://tiempo.one/docs/go-live).

## Building on it with an agent

`AGENTS.md` (and `CLAUDE.md`, which points to it) tells coding agents how this app uses Tiempo
and what not to change, and links to Tiempo's [rules for agents](https://tiempo.one/tiempo-rules.md).

## Links

- [Tiempo docs](https://tiempo.one/docs)
- [Why booking apps double-book](https://tiempo.one/docs/double-booking)
- [TypeScript SDK](https://github.com/tiempo-one/tiempo-node) (`@tiempo/sdk` on npm)
- [OpenAPI spec](https://api.tiempo.one/openapi.json)

## Licence

MIT
