# `apps/email-preview`

A small Next.js app that renders every mail template in `packages/mail` with sample data, side-by-side. Lives inside the `apps/template/` workspace at `apps/template/apps/email-preview/`. Deployable to Vercel as a public demo URL (`demo.deessejs.dev/email-preview`) for marketing and for designers previewing brand changes.

> **Why this app exists.** Two audiences that can't use the `email dev` CLI: non-developers (designers, marketing, customer success) and prospects (who don't run our code at all). The CLI is dev-only and not deployable. This app is the deployable, browser-friendly, no-install equivalent.

## Purpose

Provide a public, deployable, no-install preview of every transactional email DeesseJS ships — with sample data, with brand chrome applied, on every screen size. The app does NOT send real emails; it only renders templates and shows them as they would arrive in an inbox.

## Audience

| Audience | Use case |
|---|---|
| **DeesseJS core team** | Preview brand changes without writing test fixtures. Fast visual diff between templates. |
| **Designers** | See fonts, colors, layout across all templates without installing anything. |
| **Marketing / sales** | Send prospects a link to "this is what our transactional emails look like" before they buy. |
| **Buyer onboarding** | First-time buyers see what their customers will receive when they deploy DeesseJS. |

The app has **no auth** (it's a public preview by design) and **no DB** (no data to persist).

## Surface

URLs served (production):

| Path | Returns |
|---|---|
| `/` | Grid of all templates, with name + description + thumbnail |
| `/<template-id>` | Full preview of one template, rendered as it would appear in an inbox |
| `/<template-id>?provider=resend` | Same render, but if a real `RESEND_API_KEY` is set, optionally sends the template to a typed-in address (gated by an env flag) |
| `/api/templates` | JSON list of all registered templates (for tooling) |

The `<template-id>` matches a `MailTemplateId` from `packages/mail` (e.g. `resetPassword`, `magicLink`, `otp-sign-in`).

## Internal structure

```
apps/email-preview/
├── package.json              # name "@deessejs/email-preview", private
├── next.config.ts            # standard Next.js 16 config, no API routes other than /api/templates
├── tsconfig.json             # extends ../../tsconfig.base.json
├── src/
│   ├── app/
│   │   ├── layout.tsx        # minimal layout, brand chrome
│   │   ├── globals.css       # Tailwind 4 import + Geist fonts (mirrors apps/web)
│   │   ├── page.tsx          # the grid
│   │   ├── [template]/
│   │   │   └── page.tsx      # single-template preview
│   │   └── api/
│   │       └── templates/
│   │           └── route.ts  # GET → list of registered template IDs
│   └── components/
│       ├── TemplateCard.tsx       # card in the grid
│       ├── TemplateFrame.tsx      # "fake inbox" wrapper around the rendered template
│       └── ProviderSwitcher.tsx   # dropdown for console / resend / noop (dev only)
└── public/
    └── favicon.ico
```

## How it consumes `packages/mail`

```ts
// src/app/[template]/page.tsx
import { mailTemplates, type MailTemplateId } from '@deessejs/mail'
import { TemplateFrame } from '@/components/TemplateFrame'

export default async function TemplatePage({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params
  const id = template as MailTemplateId
  const Component = mailTemplates[id]
  const sampleProps = sampleData[id]

  return (
    <TemplateFrame>
      <Component {...sampleProps} />
    </TemplateFrame>
  )
}
```

The `workspace:*` reference in `package.json` resolves `@deessejs/mail` to the local package.

## Deploy

- **Dev:** `pnpm --filter @deessejs/email-preview dev` → port 3005.
- **Production:** Vercel project `deessejs-email-preview` (or sub-path of `demo.deessejs.dev`). Static rendering only — no API routes hit Resend in prod (the optional send is env-gated and off by default).

See [`hosting.md`](./hosting.md) for the full deploy config.

## Constraints

- **No auth.** This is a public preview by design. If we ever need to gate it (e.g. for unreleased templates), we add a Vercel password protection at the edge — no code change.
- **No DB.** No data persistence. State is the URL path.
- **No real sends by default.** The optional "send to my address" button requires `RESEND_API_KEY` AND `EMAIL_PREVIEW_ALLOW_SEND=true` AND the visitor to pass a simple captcha. Off by default in prod.
- **Sample data only.** The app uses each template's `PreviewProps` static. It does NOT load real user data from `packages/database`.

## Cross-references

### System concerns

- [`../03-web-app/`](../03-web-app/) — web app concerns (transverse)
- [`../../06-security/`](../../06-security/) — public-by-design implications

### Related packages

- [`../../11-packages/mail/`](../../11-packages/mail/) — the source of all templates
- [`../../11-packages/mail/structure.md`](../../11-packages/mail/structure.md) — file layout of the source package

### Local docs

- [`hosting.md`](./hosting.md) — Next.js + Vercel config, dev port, prod build

### Reference docs (agent memory)

- [packages/mail architecture proposal](../../.claude/agent-memory/tech-lead/project-packages-mail-architecture.md) — original proposal that included this app
- [React Email v6 unified reference](../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md)
