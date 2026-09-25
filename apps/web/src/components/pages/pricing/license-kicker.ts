import type { LicenseTypeId } from "@/lib/pricing"

/**
 * Short badge label per license tier. Independent from `LICENSE_TYPES`
 * so the marketing copy can name them differently than the data slug.
 *
 * - `open-community`  → "MIT"
 * - `per-project`     → "Pro"
 * - `subscription`    → "Pro"
 * - `enterprise`      → "Enterprise"
 */
export const LICENSE_KICKER: Record<LicenseTypeId, string> = {
  "open-community": "MIT",
  "per-project": "Pro",
  subscription: "Pro",
  enterprise: "Enterprise",
}
