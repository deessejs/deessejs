---
"@deessejs/cli": minor
---

Adds the device-flow authentication commands (ADR-020): `deesse auth login`, `deesse auth status`, and `deesse auth logout`. The CLI can now authorise itself against the DeesseJS server without a password, by opening a verification page in the user's browser and polling the server for an approval.

The commands are siblings of `init` / `list` / `info` per ADR-010 §1, and the new `auth` parent is a peer-level addition (no existing command renamed or removed).

Server wiring (the Better Auth deviceAuthorization plugin, the deviceCode table, and the five device endpoints under `/api/v1/auth/device/*`) shipped in the same PR's server-side commits; this changeset covers the client side only.

What ships:

- `deesse auth login` — requests a device code from the server, opens the browser to `verification_uri_complete` (not `verification_uri` alone, per ADR-020), polls `/device/token` every 5 seconds with `slow_down` bumping the local interval by 5 seconds, total timeout 30 minutes matching the device-code TTL. The Better Auth session token is persisted to `~/.deessejs/auth.json` with mode `0600`.

- `deesse auth status` — read-only. Prints the user identity stored in `~/.deessejs/auth.json` and confirms the server-side session is still valid. Exits 0 on no-session (a normal pre-login state) and on stale token (user reruns `deesse auth login`).

- `deesse auth logout` — POSTs to `/api/v1/auth/sign-out` then unconditionally deletes `~/.deessejs/auth.json`. A stale token file makes subsequent commands silently send a dead token, so the local cleanup is non-negotiable regardless of the server-side outcome.

Wire format is whatever Better Auth publishes; no wrapper, no custom envelope (ADR-001).

New public error codes on the CLI's closed list (ADR-010 §2, amended in lockstep):

- `cli_device_denied` — user clicked Deny in the browser.
- `cli_device_expired` — device code timed out before approval, or the code is invalid / already used.

Both codes are part of the closed public surface and are not a precedent for further openings.

The CLI now requires Node >= 20.0.0 (was >= 18.18.0) because the `open` package pinned to handle the cross-platform browser-launch vends Node 20+; the bump is overdue relative to the repo's already-pinned `^16.2.10` Next.js transitive requirement.
