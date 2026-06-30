import type { Metadata } from "next"

import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"

export const metadata: Metadata = {
  title: "Forgot password — DeesseJS",
  description: "Reset your DeesseJS password.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />
}