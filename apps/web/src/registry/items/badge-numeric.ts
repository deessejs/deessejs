import { registryItem } from "../item-helper"

export const badgeNumeric = registryItem({
  name: "badge-numeric",
  title: "NumericBadge",
  description: "Counter badge. Caps at 99 (renders as 99+).",
  sourcePath: "packages/ui/src/components/badge.tsx",
  target: "@/components/ui/badge-numeric.tsx",
  dependencies: [],
  registryDependencies: ["badge"],
})