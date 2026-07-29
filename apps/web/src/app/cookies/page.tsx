import type { Metadata } from "next"
import { CookiePolicy } from "@workspace/cookies"

export const metadata: Metadata = {
  title: "Cookie Policy",
  robots: { index: false, follow: false },
}

export default function CookiesPage() {
  return <CookiePolicy />
}
