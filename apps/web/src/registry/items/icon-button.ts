import { registryItem } from "../item-helper"

export const iconButton = registryItem({
  name: "icon-button",
  title: "IconButton",
  description: "Square icon-only button. Use for toolbar actions and dense nav.",
  sourcePath: "packages/ui/src/components/button.tsx",
  target: "@/components/ui/icon-button.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["button"],
})