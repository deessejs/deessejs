import { registryItem } from "../item-helper"

export const inputOtp = registryItem({
  name: "input-otp",
  title: "OtpInput",
  description: "One-time-code input with auto-advance and paste support.",
  sourcePath: "packages/ui/src/components/input.tsx",
  target: "@/components/ui/input-otp.tsx",
  dependencies: [],
  registryDependencies: ["input"],
})