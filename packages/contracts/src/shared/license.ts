import { z } from "zod"

/**
 * SPDX-approved license identifiers accepted by the registry.
 *
 * Per ADR-036 §5, this enum lives in `shared/` (not duplicated per version)
 * so a TemplateV1 and a future TemplateV3 agree on the allowed values.
 * Adding a value here is a minor bump on every version that imports it;
 * the immutability rule (ADR-036 §4) is preserved because `shared/` is
 * version-independent by definition.
 *
 * The closed list comes from ADR-032 (deesse-template.json) §`license`.
 * GPL-3.0 and AGPL are intentionally absent: the registry rejects copyleft
 * licenses for third-party items. Internal templates may carry any license
 * via a private registry, not the public one.
 *
 * @see ADR-032 §`license` for the per-field documentation.
 * @see ADR-036 §5 for why this lives in `shared/`.
 */
export const LICENSE = z.enum([
  "MIT",
  "Apache-2.0",
  "BSD-3-Clause",
  "BSD-2-Clause",
  "ISC",
  "MPL-2.0",
  "Unlicense",
])

export type License = z.infer<typeof LICENSE>
