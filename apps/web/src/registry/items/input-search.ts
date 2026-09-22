import { registryItem } from "../item-helper"

export const inputSearch = registryItem({
  name: "input-search",
  title: "SearchInput",
  description: "Search bar with debounce and a one-click clear button.",
  sourcePath: "packages/ui/src/components/input.tsx",
  target: "@/components/ui/input-search.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["input"],
})