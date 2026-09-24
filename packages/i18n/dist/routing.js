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
 *   - `localeDetection: true` — on the canonical unprefixed URL
 *     (`/templates`), the middleware reads `NEXT_LOCALE` first, then
 *     `Accept-Language`, and 307-redirects to the prefixed URL when
 *     the detected locale differs from `defaultLocale`. Prefixed
 *     URLs (`/fr/templates`) are stable — no subsequent redirect.
 *     See ADR-031 Decision #2 for the full rationale.
 *
 * The routing shape is constructed lazily so the `_locales.ts` module
 * (which loads `@workspace/env`) does not run at the top level of
 * `routing.ts`. The DAG: `_locales.ts` -> `@workspace/env`; `routing.ts`
 * -> `_locales.ts`; `index.ts` -> `_locales.ts` + `routing.ts` +
 * `navigation.ts`. No cycles.
 */
import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./_locales.js";
let cached = null;
function build() {
    return {
        locales: locales(),
        defaultLocale: defaultLocale(),
        localePrefix: "as-needed",
        localeDetection: true,
    };
}
/**
 * Lazy-loaded routing shape. The first access reads `LOCALES` and
 * `DEFAULT` from `@workspace/env` (via `./_locales.js`); subsequent
 * accesses reuse the cached value. The shape mirrors the shape
 * `defineRouting` would return without the `pathnames` / `domains`
 * shape extensions (V1 does not use them).
 */
export const routing = new Proxy({}, {
    get(_target, prop) {
        if (!cached)
            cached = build();
        return Reflect.get(cached, prop);
    },
    has(_target, prop) {
        if (!cached)
            cached = build();
        return Reflect.has(cached, prop);
    },
    ownKeys() {
        if (!cached)
            cached = build();
        return Reflect.ownKeys(cached);
    },
    getOwnPropertyDescriptor(_target, prop) {
        if (!cached)
            cached = build();
        return Reflect.getOwnPropertyDescriptor(cached, prop);
    },
});
// Keep `defineRouting` referenced so the next-intl dep stays in
// scope for future shape extensions (`pathnames`, `domains`). The
// reference compiles to a no-op at runtime.
void defineRouting;
