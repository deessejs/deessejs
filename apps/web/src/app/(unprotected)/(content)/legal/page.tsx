import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Legal — DeesseJS",
  description:
    "Legal documents, terms, and policies that govern your use of DeesseJS.",
}

const legalDocs = [
  {
    title: "Terms of Service",
    description:
      "The terms and conditions under which you may use DeesseJS, including license grants, acceptable use, liability, and refunds.",
    href: "/terms",
  },
  {
    title: "Privacy Policy",
    description:
      "How DeesseJS collects, uses, and protects your personal data, and the rights you have over it.",
    href: "/privacy-policy",
  },
]

export default function LegalPage() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-24">
      <div className="mx-auto max-w-2xl px-4 text-left sm:px-6 lg:px-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Legal
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          The documents below govern your use of DeesseJS. They are dummy
          placeholders for now — full legal copy will be drafted by counsel
          before public launch.
        </p>

        <div className="mt-12 divide-y divide-border/40 border border-border/40 rounded-2xl bg-card/50 overflow-hidden">
          {legalDocs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex items-start justify-between gap-4 p-6 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {doc.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {doc.description}
                </p>
              </div>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
