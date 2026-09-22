import { registryItem } from "../item-helper"

export const textarea = registryItem({
  name: "textarea",
  title: "Textarea",
  description: "Multi-line text input. Auto-grows with content.",
  sourcePath: "packages/ui/src/components/textarea.tsx",
  target: "@/components/ui/textarea.tsx",
  dependencies: [],
  registryDependencies: [],
})