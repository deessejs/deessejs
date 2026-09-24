"use client"

/**
 * Locale switcher (ADR-031 Decision #5 + Decision #9).
 *
 * Renders a small dropdown that lets the user switch between the
 * configured locales. Both apps consume this component from
 * `@workspace/i18n/switcher`; per-app styling is applied via
 * `className` (the marketing header uses a compact chip; the app
 * profile settings wraps it in a settings card).
 *
 * The component is a Client Component (the router hook requires
 * it). The locale change is performed via
 * `router.replace(pathname, { locale: nextLocale })`. The cookie
 * update is an internal side-effect of `router.replace`; there is
 * no separate setter (next-intl has no `setLocale` API).
 *
 * Implementation note: this package lives in `packages/i18n`,
 * not under `apps/`. The project's `use-shadcn` skill bans raw
 * `<input>` / `<button>` / `<select>` only inside `apps/**`; the
 * shadcn `Select` primitive is also not exported by
 * `@workspace/ui`. A plain HTML `<select>` styled with
 * `data-testid="locale-switcher"` and `data-current-locale` is
 * the correct primitive for this internal package. The
 * `use-shadcn` constraint is enforced at the app boundary
 * (the apps wrap this component in a shadcn-styled card).
 */

import { useLocale } from "next-intl"

import {
  LOCALE_LABELS,
  type Bcp47,
} from "./_locales.js"
import { usePathname, useRouter } from "./navigation.js"

export interface LocaleSwitcherProps {
  /** Optional className applied to the root element. */
  className?: string
  /** Optional label rendered before the trigger. */
  label?: string
  /** BCP-47 locales rendered as options. Defaults to the configured pair. */
  options?: readonly Bcp47[]
}

export function LocaleSwitcher({
  className,
  label,
  options,
}: LocaleSwitcherProps = {}): React.ReactElement {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as Bcp47
  const supported: readonly Bcp47[] =
    options ?? (Object.keys(LOCALE_LABELS) as Bcp47[])

  function onSelect(nextLocale: Bcp47): void {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div
      className={className}
      data-testid="locale-switcher"
      data-current-locale={currentLocale}
      aria-label={label}
    >
      {label !== undefined && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={currentLocale}
        onChange={(event) => onSelect(event.target.value as Bcp47)}
      >
        {supported.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
    </div>
  )
}
