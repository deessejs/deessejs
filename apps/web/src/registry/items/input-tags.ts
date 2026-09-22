import { registryItem } from "../item-helper"

export const inputTags = registryItem({
  name: "input-tags",
  title: "TagsInput",
  description: "Tag input with chips. Add with Enter, remove with Backspace.",
  sourcePath: "packages/ui/src/components/input.tsx",
  target: "@/components/ui/input-tags.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["input", "badge"],
})