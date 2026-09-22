import { registryItem } from "../item-helper"

export const splitButton = registryItem({
  name: "split-button",
  title: "SplitButton",
  description:
    "Primary action with a chevron trigger for a secondary dropdown.",
  sourcePath: "packages/ui/src/components/button.tsx",
  target: "@/components/ui/split-button.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["button", "dropdown-menu"],
})