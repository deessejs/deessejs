# `apps/email-preview` — Hosting

How the email preview app runs locally and in production. Same Vercel + Next.js 16 stack as `apps/web`, but with a different port in dev and a different (optional) deploy target in prod.

## Dev — local

```
apps/email-preview/         # Next.js 16 app
└── port 3005                # email dev CLI also defaults to 3000, we use 3005
```

Start with:

```bash
pnpm --filter @deessejs/email-preview dev
```

Or via the root turbo pipeline (when a `turbo.json` is added at the `apps/template/` level):

```bash
pnpm --filter "@deessejs/template-*" dev
```

The app serves on `http://localhost:3005`. The `apps/web` Next.js app uses port 3000 by default — they coexist without conflict.

## Prod — Vercel

Two deploy options:

### Option A — Sub-path of `demo.deessejs.dev`

The simplest setup. The preview lives at `demo.deessejs.dev/email-preview`, served by the same Vercel project that hosts `apps/web`. No additional project, no additional DNS.

```ts
// apps/web/next.config.ts — add a rewrite
async rewrites() {
  return [
    { source: '/email-preview', destination: '/email-preview' },
    // ... other rewrites
  ]
}
```

The email preview app must be a Next.js sub-app of `apps/web` (or in the same Vercel project root). Same `pnpm-workspace.yaml`, same build pipeline.

### Option B — Standalone Vercel project

For the demo lead-magnet context (see agent memory `project-apps-lite-workspace-setup.md`), we may want the preview deployed independently — `email-preview.deessejs.dev` — so it can be served from the OSS subset, not the full template.

```jsonc
// vercel.json (project root)
{
  "buildCommand": "pnpm --filter @deessejs/email-preview build",
  "outputDirectory": "apps/email-preview/.next",
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

This requires the `email-preview` package to build standalone (no reliance on `apps/web`'s `next.config.ts`).

**Decision deferred to M2** when we wire the demo deployment. For M1, ship Option A — simpler, no extra project.

## Runtime

Next.js 16 with the same runtime as `apps/web`:

- **Node.js runtime** (not Edge) — same as `packages/api`, per ADR [`../../11-packages/api/decisions/0001-node-runtime-not-edge.md`](../../11-packages/api/decisions/0001-node-runtime-not-edge.md).
- **Vercel Fluid Compute** when public — same as `apps/web`. Bundle size is small (no Drizzle, no Better Auth runtime, only React Email templates).

## Env

```bash
# .env.local (dev) / Vercel project env (prod)
RESEND_API_KEY=re_xxxxxxxxxxxx    # OPTIONAL — only used if "send to my address" is enabled
MAIL_FROM=noreply@deessejs.dev    # OPTIONAL — overrides packages/mail config
EMAIL_PREVIEW_ALLOW_SEND=false    # default false; set true to enable the optional send button
```

Most of the env is NOT needed — the preview app renders templates without sending them. `RESEND_API_KEY` is only consulted when a user clicks the optional "send to my address" button AND `EMAIL_PREVIEW_ALLOW_SEND=true`.

## Bundle size

| What | Estimated |
|---|---|
| React + React DOM | ~140 KB |
| react-email components + render | ~80 KB |
| Tailwind 4 | ~30 KB |
| App code | ~10 KB |
| **Total client JS** | **~260 KB gzipped** |

The app is mostly static rendering. No client-side data fetching. Lighthouse 95+ expected.

## Build verification

```bash
# Build locally
pnpm --filter @deessejs/email-preview build

# Start the prod server locally
pnpm --filter @deessejs/email-preview start
```

The prod server runs on port 3000 by default (no conflict with dev because dev is 3005).

## Edge cases

- **Brand `Wrapper` changes.** A rebrand touches `packages/mail/src/templates/Wrapper.tsx`. The preview app picks up the change on next dev refresh and on next Vercel deploy. No preview-specific code needs to change.
- **New template added.** Adding to `packages/mail/src/templates/<new>.tsx` + updating the `mailTemplates` registry auto-makes it appear in the preview grid. No preview-specific code.
- **Template removed.** Same — auto-disappears from the grid on next build.
- **Better Auth `void sendMail` rule.** Not relevant to the preview — the app never calls `sendMail` unless the optional send button is enabled, and then it's a user-triggered action gated by env.

## Cross-references

- [`./README.md`](./README.md) — purpose, audience, surface
- [`../../11-packages/mail/`](../../11-packages/mail/) — the package being previewed
- [`../03-web-app/`](../03-web-app/) — web app hosting patterns reused here
