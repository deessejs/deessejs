---
name: feedback-aliases-and-lib-location
description: User prefers @/* aliases over #/* Node.js subpath imports, and prefers lib/ folder inside src/ (not at project root)
metadata:
  type: feedback
---

# Aliases + lib/ location preferences

## The two rules

1. **Use `@/*` aliases, not `#/*`** — even though Node.js subpath imports (`#components/*` etc.) are valid and were already in `apps/web/package.json`.
2. **`lib/` lives inside `src/`**, not at project root. So `apps/web/src/lib/blog/*`, not `apps/web/lib/blog/*`.

## Why

**Why @/* over #/*:**
- User corrected my plan on 2026-06-26 ("je veuyx @"). The `#` prefix is mandatory by Node.js spec for subpath imports — they understood that and still prefer `@`.
- `@/*` reads more naturally; project already uses `@workspace/ui/...` for pnpm workspace imports, so `@/*` matches the visual style.
- `tsconfig.json` `paths` is enough for Next.js 16 to resolve at runtime (Next extends tsconfig path resolution since v13).

**Why lib/ inside src/:**
- Corrected again on 2026-06-26 after I moved lib/ to project root ("mais non c'est juste qu'on doit avoir apps/web/lib dans apps/web/src").
- Standard Next.js App Router convention. Everything in `src/` is reachable via `@/*` — single alias, no need for separate `@blog/*` or similar.
- `apps/template/apps/web/` (buyer template, separate workspace) follows the same pattern.

## How to apply

- Default tsconfig `paths` to `@/*` → `./src/*` + any specific cross-cutting alias needed (e.g. `content-collections` for the generated dir).
- Do NOT add a `package.json` `imports` field unless there's a runtime constraint that tsconfig paths can't solve.
- When creating a new app in the root workspace, `lib/` goes under `src/`, not at project root. Components stay in `src/components/`.
- When updating an existing `#foo` import, migrate to `@/foo` (or `@/lib/foo` for lib code).
- The buyer template (`apps/template/`) is a separate workspace — its own tsconfig + own conventions. Don't force-sync the alias style across workspaces.

## Anti-patterns to avoid

- Adding `#*` aliases to `package.json` even when the project has no runtime constraint.
- Putting `lib/` at project root (`apps/web/lib/`) — it's wrong for Next.js convention.
- Using `prose-p:my-4` syntax — requires `@tailwindcss/typography` plugin, not installed. Use `[&_p]:my-4` arbitrary variants instead.