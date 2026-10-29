export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded border bg-muted/40" />
      <span className="sr-only">Loading templates…</span>
    </div>
  )
}
