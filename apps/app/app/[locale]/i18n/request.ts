/**
 * Per-app i18n request config (auth app) — ADR-031 Decision #10.
 *
 * Same merge strategy as apps/web: shared catalogue + app catalogue.
 */

import type { Bcp47 } from "@workspace/i18n"
import { sharedMessages } from "@workspace/i18n/shared"
import { getRequestConfig } from "next-intl/server"
import { defaultLocale, isSupportedLocale } from "@workspace/i18n"

import appMessages from "../../../messages/en.json"
import appMessagesFr from "../../../messages/fr.json"

const APP_MESSAGES = {
  en: appMessages,
  fr: appMessagesFr,
} as const

const SHARED_MESSAGES = sharedMessages

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Bcp47 = isSupportedLocale(requested ?? "")
    ? (requested as Bcp47)
    : defaultLocale()
  const shared = SHARED_MESSAGES[locale]
  const app = APP_MESSAGES[locale]
  return {
    locale,
    messages: { ...shared, ...app },
  }
})
