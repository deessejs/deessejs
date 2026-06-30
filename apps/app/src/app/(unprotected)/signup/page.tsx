import type { Metadata } from "next"

import { SignupCard } from "@/components/auth/signup-card"

export const metadata: Metadata = {
  title: "Create account — DeesseJS",
  description: "Create your DeesseJS account.",
}

export default function SignupPage() {
  return <SignupCard />
}