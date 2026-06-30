import type { Metadata } from "next"

import { LoginCard } from "@/components/auth/login-card"

export const metadata: Metadata = {
  title: "Sign in — DeesseJS",
  description: "Sign in to your DeesseJS account.",
}

export default function LoginPage() {
  return <LoginCard />
}