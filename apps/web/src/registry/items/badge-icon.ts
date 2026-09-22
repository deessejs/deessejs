import { registryItem } from "../item-helper"

export const badgeIcon = registryItem({
  name: "badge-icon",
  title: "IconBadge",
  description: "Badge with a leading icon. Counters, status, notifications.",
  sourcePath: "packages/ui/src/components/badge.tsx",
  target: "@/components/ui/badge-icon.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["badge"],
})