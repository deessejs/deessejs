import { registryItem } from "../item-helper"

export const input = registryItem({
  name: "input",
  title: "Input",
  description:
    "Single-line text input. Controlled, accessible, keyboard-friendly.",
  sourcePath: "packages/ui/src/components/input.tsx",
  target: "@/components/ui/input.tsx",
  dependencies: [],
  registryDependencies: [],
})