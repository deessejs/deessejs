# 20. Cross-cutting

> The features that don't fit a single surface. The modular contract, the tenant context, the build system. The wedge proof lives here (20.1, 20.2).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 20.1 | Modular contract (every feature is self-contained) | ✅ | D | **The wedge proof.** Every feature in `src/features/<name>/` |
| 20.2 | Delete tests (CI-verified) | ✅ | D | For every feature, an E2E test that removes it and confirms the app runs |
| 20.3 | Feature flag system (internal) | ✅ | C | For staged rollouts, beta features |
| 20.4 | Tenant context (org-scoped everywhere) | ✅ | C | The middleware that wraps every request |
| 20.5 | Configuration system (env-driven) | ✅ | C | Zod-validated `.env` schema, typed config object |
| 20.6 | Migration system (Drizzle) | ✅ | C | Versioned, reversible |
| 20.7 | Seed scripts (dev) | ✅ | C | Sample orgs, users, data |
| 20.8 | Deployment templates (Vercel, Cloudflare, Railway) | ✅ | C | One-click for the buyer |
| 20.9 | Database backups (buyer's responsibility) | 🟣 | — | Documented, not pre-built |
| 20.10 | Disaster recovery | 🟣 | — | Buyer's cloud config |
| 20.11 | Status page (external) | 🟣 | — | Buyer uses Better Uptime, Instatus, etc. |
| 20.12 | On-call rotation | 🟣 | — | Buyer's team config |
| 20.13 | Incident management | 🟣 | — | Buyer uses Incident.io, Firehydrant, etc. |
| 20.14 | Feature flags (buyer-facing) | ✅ | C | Built-in flag SDK (`useFeatureFlag`, `server.flags.get`), UI toggle in admin dashboard (21.13), per-org and global overrides, real-time updates via Upstash Realtime. Buyer does not wire PostHog / GrowthBook. |
| 20.15 | A/B testing | ⚪ | — | v2. |
| 20.16 | Product analytics (per user) | 🟡 | U | PostHog integration documented; not pre-built |

**Notes:**
- 20.1, 20.2 (modular contract + delete tests) are the load-bearing differentiators. The whole product is built to make these work.
- 20.9–20.13 (backups, DR, status, on-call) are explicitly the buyer's responsibility. We document, we don't pre-build.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — modular contract, tenant context
- Deep dive: [`../onboarding.md`](../onboarding.md) — "Deleting features" flagship doc (the wedge proof)
- Deep dive: [`../build-roadmap.md`](../build-roadmap.md) — M8 QA, delete tests
- Related: [19-performance-and-dx.md](./19-performance-and-dx.md) — CI/CD, E2E tests
- Related: [14-documentation.md](./14-documentation.md) — architecture overview
- Related: [10-ui.md](./10-ui.md) — 10.23 DevTools bubble surfaces flag state from 20.14
- Related: [21-admin-dashboard.md](./21-admin-dashboard.md) — 21.13 surfaces flag management UI for 20.14
