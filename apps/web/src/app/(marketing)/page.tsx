import type { Metadata } from "next"
import { StarterHomepage } from "@/components/pages/starter/starter-homepage"

export const metadata: Metadata = {
  title: "SaaS Starter — DeesseJS",
  description:
    "Start your SaaS with an open source Next.js starter: authentication, PostgreSQL, and a monorepo you can make your own. Free until the DeesseJS platform launches.",
  alternates: { canonical: "https://deessejs.com" },
  openGraph: {
    title: "Start your SaaS with the hard parts in place — DeesseJS",
    description:
      "An open source Next.js SaaS starter with authentication, PostgreSQL, and a monorepo you can make your own.",
    url: "https://deessejs.com",
  },
}

export default function HomePage() {
  return <StarterHomepage />
}
