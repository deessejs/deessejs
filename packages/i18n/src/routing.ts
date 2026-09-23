/**
 * Single source of truth for the next-intl routing shape (ADR-031).
 *
 * Both apps consume this constant via
 * `import { routing } from "@workspace/i18n/routing"`. The two
 * `middleware.ts` files wrap `createMiddleware(routing)`; the two
 * `next.config.ts` files wrap `createNextIntlPlugin(...)` with the
 * matching `request.ts` path. There is no per-app `i18n/routing.ts`
 * file; the routing shape is single-sourced.
 *
 * Flags (per ADR-031 Decision #2):
 *   - `localePrefix: 'as-needed'` — default locale renders at the URL
 *     root (no prefix), other locales render under a prefix.
 *   - `localeDetection: false` — the middleware does NOT redirect
 *     unprefixed URLs based on the `NEXT_LOCALE` cookie or the
 *     `Accept-Language` header. The URL is the source of truth; the
 *     cookie is round-trippable but never mutates the URL on its own.
 *     Reasons: CDN cacheability, link sharing, crawler stability.
 *     See ADR-031 Decision #2 for the full rationale.
 *
 * The routing shape is constructed lazily so the `_locales.ts` module
 * (which loads `@workspace/env`) does not run at the top level of
 * `routing.ts`. The DAG: `_locales.ts` -> `@workspace/env`; `routing.ts`
 * -> `_locales.ts`; `index.ts` -> `_locales.ts` + `routing.ts` +
 * `navigation.ts`. No cycles.
 */
import { defineRouting } from "next-intl/routing"

import { defaultLocale, locales } from "./_locales.js"

interface RoutingShape {
  locales: readonly ["en", "fr"]
  defaultLocale: "en"
  localePrefix: "as-needed"
  localeDetection: true
}

let cached: RoutingShape | null = null

function build(): RoutingShape {
  return {
    locales: locales() as ["en", "fr"],
    defaultLocale: defaultLocale() as "en",
    localePrefix: "as-needed",
    localeDetection: true,
  }
}

/**
 * Lazy-loaded routing shape. The first access reads `LOCALES` and
 * `DEFAULT` from `@workspace/env` (via `./_locales.js`); subsequent
 * accesses reuse the cached value. The shape mirrors the shape
 * `defineRouting` would return without the `pathnames` / `domains`
 * shape extensions (V1 does not use them).
 */
export const routing: RoutingShape = new Proxy({} as RoutingShape, {
  get(_target, prop) {
    if (!cached) cached = build()
    return Reflect.get(cached, prop)
  },
  has(_target, prop) {
    if (!cached) cached = build()
    return Reflect.has(cached, prop)
  },
  ownKeys() {
    if (!cached) cached = build()
    return Reflect.ownKeys(cached)
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (!cached) cached = build()
    return Reflect.getOwnPropertyDescriptor(cached, prop)
  },
})

export type Routing = RoutingShape

// Keep `defineRouting` referenced so the next-intl dep stays in
// scope for future shape extensions (`pathnames`, `domains`). The
// reference compiles to a no-op at runtime.
void defineRouting
