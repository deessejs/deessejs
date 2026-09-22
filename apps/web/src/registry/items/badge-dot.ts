import { registryItem } from "../item-helper"

export const badgeDot = registryItem({
  name: "badge-dot",
  title: "DotBadge",
  description: "Badge with a leading status dot. Online, offline, sync states.",
  sourcePath: "packages/ui/src/components/badge.tsx",
  target: "@/components/ui/badge-dot.tsx",
  dependencies: [],
  registryDependencies: ["badge"],
})