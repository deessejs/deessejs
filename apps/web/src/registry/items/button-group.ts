import { registryItem } from "../item-helper"

export const buttonGroup = registryItem({
  name: "button-group",
  title: "ButtonGroup",
  description: "Group related buttons with shared borders and consistent spacing.",
  sourcePath: "packages/ui/src/components/button-group.tsx",
  target: "@/components/ui/button-group.tsx",
  dependencies: [],
  registryDependencies: ["button"],
})