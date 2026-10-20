import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

/**
 * `/in` — LinkedIn funnel alias.
 *
 * See `/ig/page.tsx` for the full rationale. Three aliases exist
 * (`/ig`, `/x`, `/in`) so each social-media URL can be short,
 * brand-clean, and tracked independently downstream. The
 * destination is always `/playbook`.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Playbook",
  description: "DeesseJS playbook — free PDF.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function InPage() {
  permanentRedirect("/playbook")
}
