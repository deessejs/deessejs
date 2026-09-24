/**
 * Public surface of `@workspace/i18n` (ADR-031 Decision #9 — package).
 *
 * Re-exports the typed accessors, the routing shape, the navigation
 * helpers, the `<LocaleSwitcher>`, and the shared message catalogue.
 * Internal locale parsing lives in `_locales.ts` (not exported).
 *
 * The package's `exports` map also exposes subpaths:
 *   - `@workspace/i18n/routing`      (universal; the single source of truth for `defineRouting`)
 *   - `@workspace/i18n/navigation`  (universal; `createNavigation` re-exports)
 *   - `@workspace/i18n/shared`       (universal; typed access to the JSON catalogue)
 *   - `@workspace/i18n/switcher`     (client-only; the `<LocaleSwitcher>` Client Component)
 */

export {
  type Bcp47,
  defaultLocale,
  locales,
  isSupportedLocale,
  openGraphLocale,
  availableLanguageLabel,
  LOCALE_LABELS,
} from "./_locales"

export { routing } from "./routing"
export type { Routing } from "./routing"
export {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} from "./navigation"
export {
  sharedMessages,
  type SharedMessages,
  type SharedLocale,
} from "./shared/index"

// `LocaleSwitcher` is NOT re-exported from the root. It's a Client
// Component that uses `next-intl`'s `useLocale()` and our local
// `usePathname` / `useRouter`. Importing it through the root barrel
// would pull `_locales` (and `@workspace/env/server` transitively)
// into the client bundle, where `node:fs` would explode. Consume
// the switcher from its dedicated subpath instead:
//   import { LocaleSwitcher } from "@workspace/i18n/switcher"
