<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## This app

A barbershop booking app: Next.js App Router with Cache Components, the Tiempo scheduling API
for availability and bookings, and Stripe (optional) for payment.

Tiempo's rules for agents are at https://tiempo.one/tiempo-rules.md. Read them before changing
anything that searches, holds, books or cancels. The parts this app depends on:

- Tiempo is called from server code only (`src/lib/tiempo.ts`, which imports `server-only`).
  Never pass the key, or a Tiempo client, to a client component.
- Never decide availability yourself. Search with `availability.search`, then create the booking
  and let Tiempo refuse it: a `TiempoConflictError` (409) means the slot was taken, so show
  other times. Don't check first and then book; that is the race Tiempo exists to prevent.
- A booking starts as a hold (`status: pending` with `expires_at`) and is confirmed only once
  payment succeeds. The hold must outlast the payment step: see `HOLD_MINUTES` in
  `src/lib/payments.ts`.
- If Tiempo refuses a confirm after the customer has paid, refund them (`src/lib/checkout.ts`).
  Never re-create the booking to "rescue" a late payment.
- Prices, services and customer details live in this app, not in Tiempo. Keep Tiempo metadata
  to ids and the minimum the app needs to render a page.
- Times: Tiempo takes UTC instants. Convert the shop's local dates with `src/lib/time.ts`, which
  handles clock changes.

Checks before you finish: `npm run lint`, `npm run typecheck` and `npm run build`. With a test
key set up, `npm run race` should report exactly one hold.
