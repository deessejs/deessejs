import { LICENSE_TYPES } from "@/lib/pricing"

import { LicenseCell } from "./license-cell"

/**
 * License types — 3-card shared-border grid (Open Community / Pro /
 * Agency). Renders the three subscription-priced license types from
 * `LICENSE_TYPES` in declaration order.
 */
export function LicenseTypes() {
  return (
    <div className="grid grid-cols-1 border-b border-border md:grid-cols-2 md:divide-y-0 lg:grid-cols-3">
      {LICENSE_TYPES.map((license, index, arr) => (
        <LicenseCell
          key={license.id}
          license={license}
          isLast={index === arr.length - 1}
        />
      ))}
    </div>
  )
}
