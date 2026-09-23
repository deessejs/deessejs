/**
 * Internal: locale parsing and typed accessors.
 *
 * Extracted from `index.ts` so `routing.ts` can import the same
 * accessors without forming a cycle (`index.ts` exports `routing`,
 * `routing.ts` needs `locales()` and `defaultLocale()`). The two
 * files form a DAG: `_locales.ts` -> `@workspace/env/*`; `routing.ts`
 * -> `_locales.ts`; `index.ts` -> `_locales.ts` + `routing.ts`.
 *
 * This file is internal: not exported via the package's `exports`
 * map. Consumers always import from `@workspace/i18n` (universal)
 * or `@workspace/i18n/routing` (universal).
 */

import { clientEnv } from "@workspace/env/client"
import { serverEnv } from "@workspace/env/server"

const BCP47_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/

export function isBcp47(value: string): value is Bcp47 {
  return BCP47_PATTERN.test(value)
}

function parseLocales(csv: string): string[] {
  const list = csv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  if (list.length < 2) {
    throw new Error(
      `[i18n] LOCALES must contain at least 2 locales (got: ${JSON.stringify(list)}). See ADR-031 §1.`,
    )
  }
  if (list.length !== new Set(list).size) {
    throw new Error(
      `[i18n] LOCALES contains duplicates: ${JSON.stringify(list)}.`,
    )
  }
  for (const locale of list) {
    if (!isBcp47(locale)) {
      throw new Error(
        `[i18n] Invalid BCP-47 locale in LOCALES: ${JSON.stringify(locale)}. Expected 'xx' or 'xx-YY'.`,
      )
    }
  }
  return list
}

const LOCALES_CSV: string = clientEnv.NEXT_PUBLIC_LOCALES ?? serverEnv.LOCALES
const DEFAULT_LOCALE_VALUE: string =
  clientEnv.NEXT_PUBLIC_DEFAULT_LOCALE ?? serverEnv.DEFAULT_LOCALE

export const LOCALES = parseLocales(LOCALES_CSV) as ReadonlyArray<Bcp47>

if (!isBcp47(DEFAULT_LOCALE_VALUE)) {
  throw new Error(
    `[i18n] DEFAULT_LOCALE is not a BCP-47 tag: ${JSON.stringify(DEFAULT_LOCALE_VALUE)}.`,
  )
}
if (!LOCALES.includes(DEFAULT_LOCALE_VALUE)) {
  throw new Error(
    `[i18n] DEFAULT_LOCALE (${DEFAULT_LOCALE_VALUE}) must be present in LOCALES (${LOCALES.join(",")}).`,
  )
}
export const DEFAULT: Bcp47 = DEFAULT_LOCALE_VALUE

export type Bcp47 = "en" | "fr"

export function locales(): readonly Bcp47[] {
  return LOCALES
}

export function defaultLocale(): Bcp47 {
  return DEFAULT
}

export function isSupportedLocale(candidate: string): candidate is Bcp47 {
  return LOCALES.includes(candidate as Bcp47)
}

export function openGraphLocale(locale: Bcp47): "en_US" | "fr_FR" {
  switch (locale) {
    case "en":
      return "en_US"
    case "fr":
      return "fr_FR"
  }
}

export function availableLanguageLabel(locale: Bcp47): string {
  switch (locale) {
    case "en":
      return "English"
    case "fr":
      return "Français"
  }
}

export const LOCALE_LABELS: Readonly<Record<Bcp47, string>> = {
  en: "English",
  fr: "Français",
} as const
