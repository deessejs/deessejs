import type { Metadata } from "next"
import { StarterHomepage } from "@/components/pages/starter/starter-homepage"

export const metadata: Metadata = {
  title: "SaaS Starter · DeesseJS",
  description:
    "Create a SaaS project with create-deesse-app. Start from a Next.js monorepo with authentication, PostgreSQL, and a typed API. Free until the DeesseJS platform launches.",
  alternates: { canonical: "https://deessejs.com" },
  openGraph: {
    title: "Start your SaaS with create-deesse-app · DeesseJS",
    description:
      "Create a SaaS project from a Next.js monorepo with authentication, PostgreSQL, and a typed API.",
    url: "https://deessejs.com",
  },
}

export default function HomePage() {
  return <StarterHomepage />
}
