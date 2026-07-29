---
name: use-shadcn-skill
description: 2026-07-09 initiative to stop agents from using raw HTML when @workspace/ui shadcn components exist. Three layers: (1) new skill .claude/skills/use-shadcn/SKILL.md (priming), (2) ESLint rule react/forbid-elements warn-level in react-internal.js, (3) new Checkbox component in packages/ui. Migration of 20 existing raw-HTML files is a known backlog.
metadata:
  type: project
---

# use-shadcn — agents forget to use @workspace/ui shadcn components

**Why:** agents (incl. me) repeatedly wrote raw `<input>` / `<button>` / `<select>` instead of shadcn primitives. Smoking gun: `apps/app/components/auth/login-form.tsx` L95-105 had raw `<input>` with the full shadcn `Input` className copy-pasted, while signup-form.tsx next door used `<Input />` correctly. No project-level convention + no enforcement + no signal at write time = drift.

**How to apply:** when reviewing PRs that touch apps/**/*.{tsx,jsx} or when agents build new UI, expect the use-shadcn skill to be auto-loaded (paths: apps/**/*.tsx) and the ESLint rule to flag any raw `<input|<button|<select|<textarea>`. Reference `.claude/skills/use-shadcn/SKILL.md` for the component table + decision tree.

## What's locked (3 layers)

1. **Skill**: `.claude/skills/use-shadcn/SKILL.md` — auto-invoked on UI files, lists 22 components + decision tree + anti-patterns.
2. **ESLint rule**: `react/forbid-elements` warn-level on input/button/select/textarea, added to `packages/eslint-config/react-internal.js`. Critically, `packages/eslint-config/next.js` had to be updated to spread `react-internal.js` so apps (apps/app, apps/web, apps/docs) actually inherit it — they were importing only `nextConfig` which extends `baseConfig` (TS rules only), not react rules.
3. **New component**: `packages/ui/src/components/checkbox.tsx` (Radix Checkbox via meta-package `radix-ui@1.4.3`).

## Backlog — files with raw HTML controls (warn-level only, NOT errors)

Generated 3 warnings on first lint run (out of ~20 files expected):

- `apps/app/components/auth/login-form.tsx:95` → use `<Input />`
- `apps/app/components/auth/login-form.tsx:149` → use `<Checkbox />` (newly added!)
- `apps/app/components/auth/password-input.tsx:31` → use `<Button variant="ghost" size="icon">`

Other files likely to have raw HTML (not yet linted cleanly): forgot-password-form, signup-form (already has `<Input>` but check for stragglers), settings/* forms, nav-user, org-switcher, etc.

Migrate via `code-fixer` agent (existing) or manual sweep. Bump rule to `error` after backlog cleared.

## Pre-existing errors surfaced (NOT caused by this work)

- `packages/ui/src/components/sonner.tsx` — typecheck error on `theme` prop (exactOptionalPropertyTypes). Pre-existing `M` in git status.
- `packages/database/*` — lint errors (no-require-imports, no-explicit-any, no-unused-vars). Pre-existing.
- `apps/app/components/auth/reset-password-form.tsx` — `router unused` error. Pre-existing.
- `apps/app/components/auth/*` — `react/no-children-prop` errors (tanstack-form pattern uses children-as-prop). Pre-existing pattern, may need targeted config.
- `apps/app/hooks/use-mobile.ts` — `react-hooks/set-state-in-effect`. Pre-existing.

These block CI but are unrelated — leave for separate PRs.