---
name: feedback-readme-layout-2026
description: README layout pattern validated 2026-07-28 for saas-template (commit 9de39a0): <picture> hero + shields badges + Vercel/Codespaces deploy buttons + 3-col "What's included" + GitHub alerts + tables for commands/env + Architecture notes. Reuse for similar SaaS templates.
metadata:
  type: feedback
---

For README redesigns on this repo (and similar SaaS templates), the validated 2026 layout is:

1. **Hero** — centered `<picture>` with `prefers-color-scheme` dark/light sources (GitHub officially supports this since 2025). Use a banner asset; drop `border-radius: 50%` when the asset is wider than square.
2. **One-liner pitch** under H1, before badges — answer what / who / why in ~25 words.
3. **Badges** — `shields.io`: License + CI + Stars. Skip `npm/v` and `bundlejs/size` for non-npm repos. Skip fake coverage unless there is a real source.
4. **Deploy buttons** — Vercel + GitHub Codespaces, inline.
5. **"What's included"** — 3-column markdown table (Layer | What you get | Why it matters).
6. **GitHub alerts** (`> [!TIP]`, `> [!WARNING]`) instead of emoji callouts.
7. **Tables** for `Available commands` and `Environment variables` (more scannable than bullets).
8. **Deployment section** — both the one-click explanation AND a per-app URL mapping table.
9. **Customization** section noting the project's load-bearing decisions (here: single-tenant — see [[single-tenant]]).
10. **Architecture notes** section for non-obvious decisions (proxy.ts, catalogs, schema ownership — see [[stack]], [[packages-auth]]).
11. **Closing** — Contributing + License + Support (Issues + Discussions + Email).

**Why:** user validated with "love it" on 2026-07-28 after I drafted this for `saas-template-single-tenant`. Landed in commit `9de39a0` on `chore/setup-staging-workflow`, PR https://github.com/deessejs/saas-template/pull/28.

**How to apply:** when the user asks to "redesign the README", "improve the README", or names a reference repo (shadcn/ui, T3, Vercel, Astro, Supabase), start from this structure. For multi-package monorepos with npm-distributed packages, add `npm/v` + `bundlejs/size` back. Skip the deploy buttons section if the repo is not meant to be deployed by the user.