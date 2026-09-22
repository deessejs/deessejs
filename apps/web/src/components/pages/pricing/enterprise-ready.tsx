import Link from "next/link"
import { ArrowRight, Briefcase, FileCheck, ShieldCheck } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Generic shared-border cell. Local to pricing.
 */
function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col p-6", className)}>{children}</div>
}

const PILLARS = [
  {
    icon: ShieldCheck,
    label: "SLAs",
    body:
      "Guaranteed response times and uptime commitments, written into the engagement contract.",
  },
  {
    icon: FileCheck,
    label: "DPAs",
    body:
      "Data Processing Agreements signed before any production data crosses our infrastructure.",
  },
  {
    icon: Briefcase,
    label: "Procurement",
    body:
      "Custom invoicing, dedicated contact, and a security packet your legal team can review without back-and-forth.",
  },
] as const

/**
 * Enterprise-ready — 2-col shared-border block.
 *
 * Bridge between the "Who buys what" personas and the FAQ: addresses
 * the segment of buyers who need formal procurement terms (regulated
 * industries, large in-house teams, public sector). Not a tier — these
 * buyers typically start from Pro or Agency and layer an engagement
 * contract on top.
 *
 * Visual pattern matches the FinalCta: copy on the left (eyebrow +
 * H2 + paragraph + 3-pillar list), single primary action on the
 * right. The 3-pillar list is the differentiator: it makes the
 * "what does enterprise mean here?" question concrete without
 * overstating the offering.
 */
export function EnterpriseReady() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <Cell className="gap-4 lg:!p-10">
        <p className="text-label-13 text-muted-foreground">Enterprise ready</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Built for teams that need paperwork, not slides.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          Pro and Agency already cover the technical side. For
          regulated industries, public sector, and large in-house
          teams, the rest of the deal is process. We sign the
          documents, your security team gets a packet, and the
          contract is on your terms.
        </p>
        <ul className="mt-2 flex flex-col gap-4">
          {PILLARS.map((pillar) => (
            <li key={pillar.label} className="flex items-start gap-3">
              <pillar.icon
                className="text-foreground mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-label-13 font-semibold tracking-tight text-foreground">
                  {pillar.label}
                </span>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {pillar.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell className="items-stretch justify-center gap-4 lg:!p-10">
        <Button asChild size="lg">
          <Link href="/enterprise">
            Contact us for Enterprise
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
        <p className="text-copy-13-mono text-muted-foreground inline-flex items-center gap-2 pt-2">
          Or talk to delivery
        </p>
        <Button variant="outline" size="lg" asChild>
          <Link href="/delivery">Talk to delivery</Link>
        </Button>
      </Cell>
    </div>
  )
}
