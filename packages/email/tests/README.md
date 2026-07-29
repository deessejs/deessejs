# Tests — packages/email

Run: `pnpm --filter @workspace/email test`

## What's tested

- `transport.test.ts` — factory + ConsoleTransport + `sendAuthEmail` wrapper
- `templates.test.tsx` — HTML rendering of the 3 templates via `render()` from React Email

## What's NOT tested here

- Real Resend → test manually with `MAIL_TRANSPORT=resend RESEND_API_KEY=re_xxx`
- better-auth integration → see `packages/auth/tests/`

## Env vars

`setupFiles: ["@workspace/env/server"]` requires a `.env` at the repo root.
For `MAIL_TRANSPORT=console`, only `DATABASE_URL` and `BETTER_AUTH_SECRET`
are required (see `packages/env/src/schema.ts`).