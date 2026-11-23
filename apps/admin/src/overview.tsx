export function AdminOverview() {
  return (
    <div className="grid max-w-2xl gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">Your workspace</p>
      <h2 className="text-xl font-semibold tracking-tight">Your admin dashboard is ready</h2>
      <p className="text-sm leading-6 text-muted-foreground">
        Pages contributed by your Deesse plugins appear in this dashboard.
      </p>
    </div>
  )
}
