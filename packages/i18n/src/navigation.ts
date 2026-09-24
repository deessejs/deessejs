/**
 * Localised navigation helpers from `createNavigation(routing)`.
 *
 * Per ADR-031 Decision #10, both apps consume these helpers via
 * `import { Link, useRouter, usePathname, redirect } from "@workspace/i18n/navigation"`.
 * The helpers are thin wrappers around `next/link` and `next/navigation`
 * that automatically prefix the locale segment per the routing config.
 *
 * Locale switching (Decision #5) is performed via
 * `router.replace(pathname, { locale: nextLocale })`. The cookie write
 * is an internal side-effect of `router.replace`; there is no separate
 * setter (next-intl has no `setLocale` API).
 *
 * Re-exporting both names (`useRouter` / `usePathname` from next-intl)
 * is intentional: the localised router is the same router every
 * `<LocaleSwitcher>` calls, and the same router every per-app
 * `<Link>` wrapper uses.
 */
import { createNavigation } from "next-intl/navigation"

import { routing } from "./routing"

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
