import { registryItem } from "../item-helper"

export const loadingButton = registryItem({
  name: "loading-button",
  title: "LoadingButton",
  description: "Button with an inline spinner and a disabled state while the action is in flight.",
  sourcePath: "packages/ui/src/components/button.tsx",
  target: "@/components/ui/loading-button.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["button"],
})