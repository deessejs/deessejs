import { registryItem } from "../item-helper"

export const button = registryItem({
  name: "button",
  title: "Button",
  description:
    "Trigger actions and navigation. Variants, sizes, and states for every interactive surface.",
  sourcePath: "packages/ui/src/components/button.tsx",
  target: "@/components/ui/button.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: [],
})