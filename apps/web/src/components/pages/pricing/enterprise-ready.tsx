import { Briefcase, FileCheck, ShieldCheck } from "lucide-react"

import { EnterpriseInquiryForm } from "./enterprise-inquiry-form"

import { Cell } from "./_shared/cell"

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
 * buyers typically start from Professional or Agency and layer an
 * engagement contract on top.
 *
 * Layout: copy (eyebrow + H2 + paragraph + 3 pillars SLAs / DPAs /
 * Procurement) on the left, embedded enterprise inquiry form on
 * the right. The form is the same mailto-based inquiry used on
 * /enterprise (`<EnterpriseInquiryForm>`) — intentionally duplicated
 * here for layout independence. See the form's file comment for the
 * rationale.
 *
 * Wrapped in `border-b border-border` so the section divider matches
 * every other pricing section.
 */
export function EnterpriseReady() {
  return (
    <div className="border-b border-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <Cell className="gap-4 lg:!p-10">
          <p className="text-label-13 text-muted-foreground">
            Enterprise ready
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            Built for teams that need paperwork, not slides.
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Professional and Agency already cover the technical side.
            For regulated industries, public sector, and large in-house
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
        <Cell className="lg:!p-10">
          <EnterpriseInquiryForm />
        </Cell>
      </div>
    </div>
  )
}
