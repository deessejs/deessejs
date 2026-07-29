# 23. Testing

> Cross-cutting surface, not a single milestone. Tests are built alongside every feature. The differentiators are delete tests (the modular contract's proof), flaky test detection, and multi-tenant test scenarios.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 23.1 | Unit testing (Vitest) | ✅ | C | Default framework, fast |
| 23.2 | Component testing (Vitest + Testing Library) | ✅ | C | React components |
| 23.3 | E2E testing (Playwright) | ✅ | C | The wizard + the delete tests + critical paths |
| 23.4 | Integration testing (Vitest) | ✅ | C | API + DB integration |
| 23.5 | Visual regression (Chromatic / Playwright screenshots) | ✅ | C | Docs site + landing page in v1 |
| 23.6 | API testing (oRPC + Hono) | ✅ | C | Contract tests from OpenAPI |
| 23.7 | Contract testing (OpenAPI consumer-driven) | ✅ | U | Verify the API matches what the SDK expects |
| 23.8 | Load testing (k6 or Artillery) | ✅ | U | Documented scenarios, not run in CI by default |
| 23.9 | Security testing (npm audit, Snyk) | ✅ | C | Per 18.19 |
| 23.10 | Accessibility testing (axe-core) | ✅ | C | Per 10.20, runs in CI |
| 23.11 | Lint testing (ESLint) | ✅ | C | Per 19.14 |
| 23.12 | Type testing (TypeScript) | ✅ | C | `tsc --noEmit` in CI |
| 23.13 | Coverage thresholds (≥ 80%) | ✅ | C | Configurable per feature |
| 23.14 | Coverage reporting (Codecov / similar) | ✅ | C | PR comments |
| 23.15 | Test data management (factories) | ✅ | C | Per-entity factories, no hardcoded fixtures |
| 23.16 | Database testing (test DB, transactional rollback) | ✅ | C | Per-test isolation |
| 23.17 | Mocking strategy (MSW for HTTP, vi for modules) | ✅ | C | Standard, documented |
| 23.18 | Test environment (`.env.test`) | ✅ | C | Sandbox services, no real sends |
| 23.19 | Pre-commit hooks (Husky + lint-staged) | ✅ | C | Per 19.16 |
| 23.20 | CI test runs (GitHub Actions) | ✅ | C | Matrix: unit, integration, E2E, a11y, perf, SEO |
| 23.21 | Test parallelization | ✅ | C | E2E sharded, unit parallelized |
| 23.22 | Test retry on flake | ✅ | C | Playwright retry, log flaky |
| 23.23 | Flaky test detection (CI history) | ✅ | D | Flag tests that flake > 2% of runs. **Rare to ship this.** |
| 23.24 | Test reporting (HTML, JUnit XML) | ✅ | C | For CI dashboards |
| 23.25 | Delete tests (every feature) | ✅ | D | Per 20.2 — the modular contract's proof |
| 23.26 | Smoke tests (post-deploy) | ✅ | C | Health check + critical paths |
| 23.27 | Mutation testing (Stryker) | ⚪ | — | v2. Slow, high signal but expensive. |
| 23.28 | Snapshot testing (Jest-style) | 🟡 | U | For non-visual outputs (e.g. email HTML) |
| 23.29 | Time travel (mocked clocks) | ✅ | C | For time-sensitive tests (subscriptions, trials) |
| 23.30 | Multi-tenant test scenarios | ✅ | D | Per-org isolation tested, per-plan limits tested. **Rare to ship this.** |
| 23.31 | Feature flag test scenarios | ✅ | C | Toggle flags, verify both paths |
| 23.32 | Localization test scenarios | 🟡 | U | v1 en only; v2 with i18n |

**Notes:**
- 23.23 (flaky test detection) and 23.30 (multi-tenant scenarios) are differentiators.
- 23.25 (delete tests) is the wedge proof — already mentioned in 20.2; this is the testing-side surface.
- 23.7 (contract testing) catches API/SDK drift before it ships.
- 23.18 (test environment) is important: we ship a `.env.test` with sandbox API keys for Stripe test mode, Resend sandbox, R2 dev bucket. The buyer can run the full test suite offline (no real services hit).
- 23.20 (CI matrix) is the public surface of testing discipline — a green CI badge means the modular contract holds, the SEO is good, the a11y is good, the perf is good.

## Testing strategy by layer

| Layer | Tool | Coverage target | Runs on |
|---|---|---|---|
| Unit | Vitest | 80% lines / 75% branches | Every PR, every commit |
| Component | Vitest + Testing Library | 80% lines | Every PR |
| Integration | Vitest + real Postgres + real Redis | Critical paths | Every PR |
| E2E | Playwright | Wizard + delete tests + critical paths | Every PR (sharded) |
| Visual | Playwright screenshots | Landing + docs | Every PR (subset) |
| Contract | OpenAPI diff | All endpoints | Every PR |
| A11y | axe-core | All pages | Every PR |
| SEO | Lighthouse CI | Score ≥ 90 | Every PR |
| Perf | Lighthouse CI | p95 < 200ms | Every PR (nightly full) |
| Security | npm audit + Snyk | Zero high / critical | Every PR |
| Load | k6 | Documented scenarios | Nightly (not blocking) |
| Smoke | Playwright | Health + critical paths | Post-deploy |

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../build-roadmap.md`](../build-roadmap.md) — M8 QA pass uses these tests
- Deep dive: [`../onboarding.md`](../onboarding.md) — wizard tested by 5 fresh users
- Related: [19-performance-and-dx.md](./19-performance-and-dx.md) — testing templates (19.18-19.21)
- Related: [20-cross-cutting.md](./20-cross-cutting.md) — 20.2 delete tests (the wedge proof)
- Related: [18-security-and-compliance.md](./18-security-and-compliance.md) — 18.19 dep scanning
- Related: [10-ui.md](./10-ui.md) — 10.20 accessibility (tested via 23.10)
- Related: [22-seo.md](./22-seo.md) — 22.16 Lighthouse SEO audit in CI
