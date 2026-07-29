# Testing

## Decision

A **layered testing stack** with one tool per layer. Each tool has a clear scope and they compose into a single CI matrix.

- **Vitest** for unit, component, and integration tests.
- **Playwright** for end-to-end tests (and visual regression).
- **axe-core** (via Playwright) for accessibility tests.
- **Lighthouse CI** for performance and SEO audits.
- **MSW** for HTTP mocking in unit/integration tests.
- **k6** for load tests (run nightly, not blocking).
- **Husky + lint-staged** for pre-commit hooks.
- **ESLint + Prettier** for lint and format (per feature 19.14, 19.15).

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

| Layer | Tool | When it runs |
|---|---|---|
| Unit | Vitest | Every PR, every commit |
| Component | Vitest + Testing Library | Every PR |
| Integration | Vitest + real Postgres + Redis | Every PR (critical paths) |
| E2E | Playwright (sharded) | Every PR (wizard + delete tests + critical paths) |
| Visual | Playwright screenshots | Every PR (subset: landing + docs) |
| Contract | OpenAPI diff (built into oRPC + Hono) | Every PR |
| A11y | axe-core via Playwright | Every PR |
| SEO | Lighthouse CI | Every PR (score ≥ 90) |
| Perf | Lighthouse CI | Every PR (nightly full run) |
| Security | npm audit + Snyk | Every PR |
| Load | k6 | Nightly (not blocking) |
| Smoke | Playwright | Post-deploy |
| Lint | ESLint | Pre-commit + every PR |
| Format | Prettier | Pre-commit + every PR |
| Types | TypeScript (`tsc --noEmit`) | Every PR |

## Vitest (unit + component + integration)

### Why Vitest

- **Vite-native.** Fast cold starts, fast HMR.
- **Jest-compatible API.** Familiar to most JS developers.
- **TypeScript-native.** No Babel config dance.
- **Built-in coverage.** `c8` integration.
- **Component testing via Testing Library.**

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Jest** | Slower cold start. TS config more complex. Still works but Vitest is the modern default. |
| **uvu / node:test** | Too low-level for our needs. |
| **Mocha + Chai** | Older stack. Less TS-native. |

### Pattern

```ts
// packages/auth/auth.test.ts
import { describe, it, expect } from 'vitest';
import { verifyPassword } from './auth';

describe('verifyPassword', () => {
  it('returns true for correct password', () => {
    expect(verifyPassword('correct', 'hashed')).toBe(true);
  });

  it('returns false for wrong password', () => {
    expect(verifyPassword('wrong', 'hashed')).toBe(false);
  });
});
```

## Playwright (E2E + visual + a11y)

### Why Playwright

- **Multi-browser.** Chromium, Firefox, WebKit.
- **Multi-platform.** macOS, Linux, Windows.
- **Built-in sharding** for parallel CI.
- **Built-in trace viewer** for debugging flakes.
- **Native TypeScript.**
- **axe-core integration** via `@axe-core/playwright`.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Cypress** | Browser-only (no WebKit/Firefox parity). Slower. Worse TS support. |
| **Puppeteer** | Chromium-only. No multi-browser. |
| **TestCafe** | Smaller community. |
| **WebdriverIO** | More complex setup. |

### Pattern

```ts
// e2e/wizard.spec.ts
import { test, expect } from '@playwright/test';

test('new buyer completes the wizard', async ({ page }) => {
  await page.goto('/setup');
  await page.getByLabel('Database URL').fill(process.env.TEST_DATABASE_URL!);
  await page.getByRole('button', { name: 'Next' }).click();
  // ... continue wizard
  await expect(page.getByText('Setup complete')).toBeVisible();
});
```

## axe-core (a11y)

### Why axe-core

- **Industry standard.** Deque's accessibility rules engine.
- **Playwright integration.** `@axe-core/playwright` runs axe in the browser context.
- **CI integration.** Fails the build on violations.

### Pattern

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Lighthouse CI (perf + SEO)

### Why Lighthouse CI

- **Built-in scoring.** Performance, accessibility, best practices, SEO.
- **CI integration.** Fails on regressions.
- **Comes from Google.** Trusted benchmark.

### Pattern

```yaml
# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/pricing"],
      "startServerCommand": "pnpm dev"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

## MSW (HTTP mocking)

### Why MSW

- **Network-level mocking.** Intercepts at the fetch layer, not the SDK.
- **Same mocks in unit, integration, and E2E.** Reusable.
- **TypeScript-native.**

### Pattern

```ts
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/projects', () => {
    return HttpResponse.json([{ id: '1', name: 'Test Project' }]);
  }),
];
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { setupServer } from 'msw/node';

export default defineConfig({
  test: {
    setupFiles: ['./mocks/server.ts'],
  },
});
```

## k6 (load testing)

### Why k6

- **JavaScript test scripts.** Familiar.
- **Cloud or self-hosted runner.** Flexible.
- **Realistic load profiles.** Ramp-up, sustained, spike.

### Pattern

```js
// load/wizard.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://staging.deessejs.com/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Husky + lint-staged (pre-commit)

### Why Husky

- **Standard pre-commit framework.** Everyone knows it.
- **lint-staged** runs lint/format only on staged files (fast).

### Pattern

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.md": ["prettier --write"]
  }
}
```

```sh
# .husky/pre-commit
pnpm lint-staged
pnpm tsc --noEmit
```

## ESLint + Prettier

- **ESLint**: Next.js's default config + our custom rules (no `any`, no `console.log` in committed code).
- **Prettier**: Default config + our `.prettierrc` overrides.

## CI matrix

Per CI configuration (`.github/workflows/ci.yml`):

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps: [checkout, install, test:unit]
  integration:
    runs-on: ubuntu-latest
    services: [postgres, redis]
    steps: [checkout, install, test:integration]
  e2e:
    runs-on: ubuntu-latest
    steps: [checkout, install, test:e2e (sharded)]
  a11y:
    runs-on: ubuntu-latest
    steps: [checkout, install, test:a11y]
  lighthouse:
    runs-on: ubuntu-latest
    steps: [checkout, install, test:lighthouse]
  security:
    runs-on: ubuntu-latest
    steps: [checkout, install, audit]
  smoke:
    needs: [deploy]
    runs-on: ubuntu-latest
    steps: [checkout, test:smoke]
```

## Coverage thresholds

- **Lines:** 80%
- **Branches:** 75%
- **Per-feature configurable** in the feature module's `vitest.config.ts`.

## Flaky test handling

- **Detection** (per feature 23.23): tests that flake >2% of runs get auto-quarantined.
- **Quarantine**: skipped by default, runs in a separate nightly job for fix-tracking.
- **Fix SLA**: 48h to fix or remove.

## What's deferred to v2 (or skipped)

- **Stryker mutation testing** (per feature 23.27) — high signal but slow. v2.
- **Visual regression for all pages** — v1 covers landing + docs. Full coverage is v2.
- **Time-travel mocks** — minimal in v1. Vitest's fake timers cover the common cases.

## Cross-references

- [`../10-decisions/`](../10-decisions/) — ADRs for individual test tools (when written).
- [`../08-testing/`](../08-testing/) — the test architecture (strategy, layers, delete-test pipeline).
- [`../05-modular-contract/delete-tests.md`](../05-modular-contract/) — the delete-test pipeline.
- [`../../product/features/19-performance-and-dx.md`](../../product/features/19-performance-and-dx.md) — perf + DX testing (Lighthouse, bundle analyzer).
- [`../../product/features/22-seo.md`](../../product/features/22-seo.md) — SEO testing (Lighthouse SEO audit).
- [`../../product/features/23-testing.md`](../../product/features/23-testing.md) — the full test feature inventory.
