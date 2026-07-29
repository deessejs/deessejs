# 19. Performance & DX

> Lighthouse ≥ 90, server response < 200ms p95 — both measured in CI. Type safety end-to-end, linting, formatting, testing templates, E2E + delete tests. The "polished UX" axis extends to the developer experience.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 19.1 | Server-side rendering (default) | ✅ | C | Next.js default |
| 19.2 | Static site generation (where appropriate) | ✅ | C | Next.js default |
| 19.3 | Incremental static regeneration | ✅ | C | Next.js default |
| 19.4 | Edge runtime support (where it makes sense) | ✅ | C | Mostly API routes, not full pages |
| 19.5 | Image optimization | ✅ | C | Next.js Image |
| 19.6 | Font optimization | ✅ | C | Next.js Font |
| 19.7 | Code splitting | ✅ | C | Next.js default |
| 19.8 | Tree shaking | ✅ | C | Next.js default |
| 19.9 | Bundle analysis (`@next/bundle-analyzer`) | ✅ | C | Documented in `docs/perf.md` |
| 19.10 | Caching strategies (SWR, React Query) | ✅ | C | Server components + client cache |
| 19.11 | Lighthouse score ≥ 90 | ✅ | C | Measured in CI |
| 19.12 | Server response < 200ms p95 | ✅ | C | Measured in CI |
| 19.13 | Type safety end-to-end | ✅ | C | Drizzle → oRPC → React |
| 19.14 | Linting (ESLint) | ✅ | C | Next.js config + custom rules |
| 19.15 | Formatting (Prettier) | ✅ | C | |
| 19.16 | Pre-commit hooks (Husky) | ✅ | C | Lint + typecheck + format |
| 19.17 | CI/CD templates (GitHub Actions) | ✅ | C | Test, lint, typecheck, build, deploy |
| 19.18 | Testing templates (Vitest, Playwright) | ✅ | C | |
| 19.19 | Unit tests | ✅ | C | For every feature module |
| 19.20 | E2E tests (Playwright) | ✅ | C | The wizard + the delete tests |
| 19.21 | Visual regression tests | 🟡 | U | v1 ships for the docs / landing; not full product |
| 19.22 | Hot reload (`pnpm dev` is fast) | ✅ | C | Turbopack |
| 19.23 | DevTools (React DevTools, Network, etc.) | ✅ | C | Standard |
| 19.24 | Error boundaries | ✅ | C | App-level + per-feature |
| 19.25 | Logging (server + client) | ✅ | C | Structured, level-based, swappable |
| 19.26 | Tracing (server) | ✅ | C | OpenTelemetry, swappable backend |

**Notes:**
- 19.11 / 19.12 (Lighthouse + server response) are measured in CI. If a PR regresses, it fails the build.
- 19.20 (E2E + delete tests) is the modular contract's proof — the CI runs `pnpm test:delete --feature=<X>` for every feature.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — monorepo, build system, testing setup
- Related: [20-cross-cutting.md](./20-cross-cutting.md) — delete tests, modular contract
- Related: [18-security-and-compliance.md](./18-security-and-compliance.md) — CI/CD templates for dep scanning
- Related: [`../build-roadmap.md`](../build-roadmap.md) — M8 QA pass
