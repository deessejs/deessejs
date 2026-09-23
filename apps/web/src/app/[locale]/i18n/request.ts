/**
 * Per-app i18n request config — ADR-031 Decision #10.
 *
 * Merges the shared message catalogue (from `@workspace/i18n/shared`)
 * with the app-specific catalogue (from `messages/<locale>.json`).
 * The merge is a simple `{ ...sharedMessages, ...appMessages }`
 * spread; the app catalogue takes precedence on key collision (the
 * CI guard rejects shared key duplication, but we keep the spread
 * order defensive).
 *
 * `getRequestConfig` runs once per request (cached by next-intl) so
 * the runtime cost of the merge is negligible (two ~30-key objects).
 */

import type { Bcp47 } from "@workspace/i18n"
import { sharedMessages } from "@workspace/i18n/shared"
import { getRequestConfig } from "next-intl/server"
import { defaultLocale } from "@workspace/i18n"

import appMessages from "../../messages/en.json"
import appMessagesFr from "../../messages/fr.json"

const APP_MESSAGES = {
  en: appMessages,
  fr: appMessagesFr,
} as const

const SHARED_MESSAGES = sharedMessages

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Bcp47 = (SHARED_MESSAGES[requested as Bcp47]
    ? (requested as Bcp47)
    : defaultLocale()) as Bcp47
  const shared = SHARED_MESSAGES[locale]
  const app = APP_MESSAGES[locale]
  return {
    locale,
    messages: { ...shared, ...app },
  }
})
