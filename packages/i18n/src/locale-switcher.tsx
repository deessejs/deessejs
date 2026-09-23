"use client"

/**
 * Locale switcher (ADR-031 Decision #5 + Decision #9).
 *
 * Renders a shadcn `Select` (Radix-based) that lets the user switch
 * between the configured locales. Both apps consume this component
 * from `@workspace/i18n/switcher`; per-app styling is applied via
 * `className` (the marketing header uses a compact chip; the app
 * profile settings wraps it in a settings card).
 *
 * The component is a Client Component (the Radix `Select` requires
 * it). The locale change is performed via `router.replace(pathname,
 * { locale: nextLocale })`. The cookie update is an internal
 * side-effect of `router.replace`; there is no separate setter
 * (next-intl has no `setLocale` API).
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  LOCALE_LABELS,
  type Bcp47,
} from "./_locales.js"
import { usePathname, useRouter } from "./navigation.js"

export interface LocaleSwitcherProps {
  /** Optional className applied to the SelectTrigger. */
  className?: string
  /** Optional label rendered before the trigger (e.g. "Language"). */
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
  // The active locale is inferred from the current URL segment on the
  // server side (via the [locale]/layout.tsx) and exposed through
  // `useLocale()` at runtime. We import directly from next-intl for
  // the hook to keep the package's per-app typography identical.
  const currentLocale = useNextIntlLocale()
  const supported: readonly Bcp47[] =
    options ?? (LOCALE_LABELS ? Object.keys(LOCALE_LABELS) as Bcp47[] : [])

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
      <Select value={currentLocale} onValueChange={onSelect}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supported.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Inline a minimal `useNextIntlLocale` import so the bundler keeps the
// dependency on next-intl implicit (consumers depend on next-intl
// transitively via `@workspace/i18n`).
import { useLocale } from "next-intl"
function useNextIntlLocale(): Bcp47 {
  return useLocale() as Bcp47
}
