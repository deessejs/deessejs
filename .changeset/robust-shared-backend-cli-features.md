---
"@deessejs/cli": minor
---

Make the CLI resilient to backend outages and to backend drift.

- Disk cache at `~/.deessejs/templates.json` (JSON, atomic write). Subsequent
  `deessejs list/info/init` calls send `If-None-Match` against the server's
  ETag and serve the cached body on a 304.
- Retry on transient failures (3 attempts, 250ms / 750ms / 2s backoff with
  jitter). Retries on network errors, HTTP 5xx, and HTTP 429 (honors the
  server's `X-RateLimit-Reset`). Graceful fallback to the disk cache when
  the backend is unreachable and a cache entry exists.
- New global `--offline` flag that skips the network entirely and serves
  the on-disk cache. Errors with a clear message if no cache is available.
- Non-blocking CLI version probe against `/api/v1/cli-version` on startup.
  Prints a warning when the local version is below `minSupported`, with a
  hint to upgrade via `pnpm dlx deessejs@latest`. The probe is best-effort
  and never fails the command.
- HTTP routes move from `/api/templates` to `/api/v1/templates`. The CLI
  points at the new path by default; the `--api-url` flag and
  `DEESSEJS_API_URL` env var still override.

Internal note: the new `--offline` flag is a global option and may appear in
help output for every subcommand.
