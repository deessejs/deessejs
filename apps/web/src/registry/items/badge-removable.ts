import { registryItem } from "../item-helper"

export const badgeRemovable = registryItem({
  name: "badge-removable",
  title: "RemovableBadge",
  description: "Badge with a close button. Use for tag inputs and filters.",
  sourcePath: "packages/ui/src/components/badge.tsx",
  target: "@/components/ui/badge-removable.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["badge"],
})