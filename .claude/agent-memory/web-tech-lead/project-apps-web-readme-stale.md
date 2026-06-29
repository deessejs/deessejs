---
name: project-apps-web-readme-stale
description: apps/web/README.md is still the default create-next-app README — don't trust it for stack info, read package.json + CLAUDE.md instead
metadata:
  type: project
---

`apps/web/README.md` is still the boilerplate from `create-next-app` — references `npm run dev`, `yarn`, `bun`, says "you can start editing by modifying `app/page.tsx`" (we use `src/app/`), and links to Vercel deployment docs we don't use.

**Don't:**
- Quote it for stack info (it'll be wrong)
- Suggest editing the file as a "fix" — it's not a bug, it's a not-yet-written real README

**Do:**
- Read `apps/web/package.json` for the actual stack (Next 16.2.9, React 19.2.4, etc.)
- Read `apps/web/CLAUDE.md` for the "This is NOT the Next.js you know" warning
- Read `apps/web/next.config.ts` for the load-bearing config
- Read `apps/web/content-collections.ts` for the content engine

**When to fix:** The README is a real gap that should be filled with the actual stack, dev/build/lint commands, content engine explanation, and a "deploy" section that points to the actual deployment path (Vercel is the default for `pnpm --filter web deploy`, but the agent should confirm with the user before recommending).

**How to apply:** If a question would normally be answered by reading README.md, redirect to package.json + CLAUDE.md. Flag the gap as a low-priority cleanup item, not a blocker.

Related: [[project-apps-web-scope-and-boundaries]]