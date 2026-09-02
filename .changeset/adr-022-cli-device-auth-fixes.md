---
"@deessejs/cli": minor
"@workspace/auth": minor
---

ADR-022: documents two gaps in the ADR-020 device-auth flow surfaced during the staging smoke after the staging-to-main promotion. First, the CLI's `deesse auth login` succeeds end-to-end but writes `user.id = ""` to `~/.deessejs/auth.json` (the user sees `logged in as unknown user` and `auth status` reports "session invalid"): `fetchUserIdentity` calls `authClient.getSession()` without an `Authorization` header, and the server does not register the `bearer()` plugin that would make the header resolvable. Second, the web verification page `/device` has no sign-in gate: the proxy's `config.matcher` does not include `/device` (the bounce branch is dead code), and the page itself does not check the session before rendering the Approve/Deny buttons, so a user who lands there while anonymous clicks Approve and gets HTTP 401 from Better Auth.

The ADR explains both root causes, references the canonical Better Auth patterns and the production comparison (Vercel, GitHub, Microsoft, Auth0, Google device flow), and pins the implementation path: wire `bearerFetch` into `fetchUserIdentity` (replace the `?? { id: "" }` fallback with a hard `cli_device_expired` throw), register `bearer()` in `packages/auth/src/auth.ts` between `deviceAuthorization` and `nextCookies`, and add a server-side session check + redirect to `/login?redirect=/device?user_code=...` in the device page Server Component, plus adding `/device` to the proxy's `config.matcher`.

This PR ships the ADR and the docs index entry only. The implementation lands in a follow-up PR; this changeset declares the upcoming minor bumps on `@deessejs/cli` and `@workspace/auth` so reviewers understand the lineage and the release pipeline can attribute the bump correctly.
