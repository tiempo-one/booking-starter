/** Shown instead of a page that needs Tiempo before the starter has been set up. */
export function SetupNeeded() {
  return (
    <div className="notice warn">
      <p>
        <strong>Not set up yet.</strong> Put a Tiempo test key in <code>.env.local</code> as{' '}
        <code>TIEMPO_API_KEY</code>, then run <code>npm run setup</code> and restart <code>npm run dev</code>.
      </p>
    </div>
  )
}
