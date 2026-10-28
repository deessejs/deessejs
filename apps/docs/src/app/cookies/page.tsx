import type { Metadata } from "next"
import { CookiePolicy } from "@workspace/cookies"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Learn how DeesseJS uses cookies and optional analytics.",
}

export default function CookiesPage() {
  return <CookiePolicy />
}
