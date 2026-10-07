/**
 * Async & jobs queue log — first version.
 *
 * Shows the operator view of a background-job processing pipeline:
 *   - Per-job rows with id, kind, status, attempt, started_at
 *   - Status uses emerald (done), amber (running), red (failed)
 *   - A current pulse on the running row (a single colour cue)
 *
 * Static. Pairs with the "Background jobs" capability card in
 * /use-cases/saas-apps. Tiles into the peek pattern of
 * <CapabilitiesTabs>; readable portion sits in the bottom-right.
 *
 * Future edits: add retry timing, dead-letter bucket, throughput
 * counter.
 */

const JOBS = [
  { id: "j_8a3f", kind: "send_welcome_email", status: "ok",      attempt: 1, ms: 182 },
  { id: "j_8b2c", kind: "sync_stripe_customer", status: "ok",     attempt: 1, ms: 412 },
  { id: "j_8c11", kind: "issue_invite_token",   status: "run",    attempt: 1, ms: null },
  { id: "j_8d4e", kind: "render_invoice_pdf",   status: "retry",  attempt: 2, ms: null },
  { id: "j_8f9a", kind: "purge_old_sessions",   status: "ok",     attempt: 1, ms: 71 },
] as const

const STATUS_COLOR: Record<string, string> = {
  ok:     "text-emerald-700 dark:text-emerald-400",
  run:    "text-amber-700 dark:text-amber-400",
  retry:  "text-red-600 dark:text-red-400",
}

const STATUS_LABEL: Record<string, string> = {
  ok:    "ok",
  run:   "···",
  retry: "retry",
}

export function QueueLogMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-label-12 text-muted-foreground">
        <span>Queue · 3 workers</span>
        <span>recent</span>
      </div>
      <ul className="flex flex-col gap-1 font-mono text-copy-13">
        {JOBS.map((job) => (
          <li key={job.id} className="flex items-center gap-2 leading-5">
            <span className="w-12 shrink-0 text-muted-foreground">{job.id}</span>
            <span className="flex-1 truncate text-foreground">{job.kind}</span>
            <span className="w-8 shrink-0 text-right text-muted-foreground">
              ×{job.attempt}
            </span>
            <span
              className={`w-12 shrink-0 text-right ${STATUS_COLOR[job.status]}`}
            >
              {STATUS_LABEL[job.status]}
              {job.ms != null ? ` ${job.ms}ms` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
