import { registryItem } from "../item-helper"

export const copyCommand = registryItem({
  name: "copy-command",
  title: "CopyCommand",
  description:
    "Inline copy-to-clipboard command with check feedback. Drop into any hero or marketing section.",
  sourcePath: "app/(marketing)/_components/copy-command.tsx",
  target: "@/components/marketing/copy-command.tsx",
  dependencies: ["lucide-react"],
  registryDependencies: ["button"],
})