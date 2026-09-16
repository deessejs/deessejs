import { registryItem } from "../item-helper"

export const flickeringGrid = registryItem({
  name: "flickering-grid",
  title: "FlickeringGrid",
  description:
    "Canvas-based decorative grid for hero backgrounds. No external runtime dependencies.",
  sourcePath: "app/(marketing)/_components/flickering-grid.tsx",
  target: "@/components/marketing/flickering-grid.tsx",
  dependencies: [],
  registryDependencies: [],
})