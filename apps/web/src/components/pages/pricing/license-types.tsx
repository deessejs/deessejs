import { LICENSE_TYPES } from "@/lib/pricing"

import { LicenseCell } from "./license-cell"

/**
 * License types — 3-card shared-border grid (Open Community / Pro /
 * Enterprise). Only the non-banner license types render in the grid;
 * the Subscription banner is rendered as a horizontal banner
 * immediately below in the original layout — kept as-is for now
 * (banner mode on `LICENSE_TYPES` is documented but unused in the
 * current data).
 */
export function LicenseTypes() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-b border-border md:divide-y-0">
      {LICENSE_TYPES.filter((l) => !l.banner).map((license, index, arr) => (
        <LicenseCell
          key={license.id}
          license={license}
          isLast={index === arr.length - 1}
        />
      ))}
    </div>
  )
}
