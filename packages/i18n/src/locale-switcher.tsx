"use client"

/**
 * Locale switcher (ADR-031 Decision #5 + Decision #10).
 *
 * Renders a small dropdown that lets the user switch between the
 * configured locales. Both apps consume this component from
 * `@workspace/i18n/switcher`; per-app styling is applied via
 * `className` (the marketing header uses a compact chip; the app
 * profile settings wraps it in a settings card).
 *
 * The component is a Client Component (the `useRouter` and
 * `usePathname` hooks require it). The locale change is performed
 * via `router.replace(pathname, { locale: nextLocale })`. The cookie
 * update happens as an internal side-effect of `router.replace`;
 * there is no separate setter (next-intl has no `setLocale` API).
 *
 * The switcher reads the active locale via `useLocale()` from
 * `next-intl/navigation` and resolves the matching label from the
 * `LOCALE_LABELS` table below. The label is rendered as the
 * dropdown's trigger; clicking an option navigates to the new
 * locale's URL via the localised router.
 */

import { useLocale } from "next-intl"

import {
  LOCALE_LABELS,
  type Bcp47,
} from "./index.js"
import { usePathname, useRouter } from "./navigation.js"

export interface LocaleSwitcherProps {
  /**
   * Optional className applied to the root element. The marketing
   * app passes a compact chip class; the authenticated app passes
   * a card-friendly class. Default: empty string (no extra style).
   */
  className?: string
  /**
   * Override the default label "Language" rendered before the
   * current locale name (e.g. in the profile settings card).
   * The marketing header hides this label.
   */
  label?: string
}

const SUPPORTED_LOCALES: readonly Bcp47[] = ["en", "fr"] as const

export function LocaleSwitcher({
  className,
  label,
}: LocaleSwitcherProps = {}): React.ReactElement {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as Bcp47

  function onSelect(nextLocale: Bcp47): void {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div
      className={className}
      data-testid="locale-switcher"
      aria-label={label ?? "Language"}
    >
      {label !== undefined && <span className="locale-switcher-label">{label}</span>}
      <select
        className="locale-switcher-select"
        value={currentLocale}
        onChange={(event) => onSelect(event.target.value as Bcp47)}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
    </div>
  )
}
