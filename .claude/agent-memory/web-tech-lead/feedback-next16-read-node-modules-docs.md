---
name: feedback-next16-read-node-modules-docs
description: Always read node_modules/next/dist/docs/ before writing Next.js 16 code in apps/web — the README at apps/web/CLAUDE.md is non-negotiable
metadata:
  type: feedback
---

Before writing any non-trivial Next.js code in `apps/web/`, read the relevant guide in `node_modules/next/dist/docs/`.

**Why:** `apps/web/CLAUDE.md` declares:
> This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This is not boilerplate. Next 16 changes:
- Route handlers signature (`params` is now async — must be `await`ed)
- Dynamic route param shape
- `cookies()`, `headers()`, `draftMode()` are async-only (no sync variants)
- Layout/page receiving `searchParams` is now async
- Server Actions: signature changes around form binding
- `next/image` defaults tightened
- `next/link` no longer wraps `<a>` automatically in some cases

If you write code from training memory, you will ship subtle bugs that pass typecheck but fail at runtime (or worse, silently leak server-only code to the client).

**How to apply:**
- Before any of: new page.tsx, new route.ts, new server action, new layout, dynamic params, cookies/headers usage, redirects/rewrites, middleware
- Read: `node_modules/next/dist/docs/<topic>.md` (the .md files alongside the .d.ts files)
- Cross-check with `node_modules/next/dist/docs/app/api-reference/...` for signatures
- If unsure, also check `node_modules/next/CHANGELOG.md` (mentioned in CLAUDE.md "deprecation notices")

This is a per-task rule, not a one-time read. Next 16 docs in node_modules are the source of truth for THIS project.

Related: [[reference-next16-apps-web-quirks]], [[reference-nextjs-route-groups]] (general Next.js route groups reference), [[reference-nextjs-dynamic-routes]] (general dynamic routes reference)