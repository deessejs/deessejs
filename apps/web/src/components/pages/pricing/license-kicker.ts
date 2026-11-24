import type { LicenseTypeId } from "@/lib/pricing"

/**
 * Short badge label per displayed offer.
 */
export const LICENSE_KICKER: Record<LicenseTypeId, string> = {
  "open-community": "MIT",
  pro: "For every developer seat",
}
