import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { ContractsGrid } from "@/app/(marketing)/_components/contracts-grid"
import { CONTRACTS } from "@/lib/marketing/home-data"

/** Contracts - 3-col bento with mini-UI mockups + stack matrix. */
export function Contracts() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Under the hood"
        title="Six contracts. Open stack. Typed end-to-end."
        subtitle="Each contract exports its own TypeScript types. Your agent reads them through MCP, your IDE autocompletes them, your tests cover them. Swap Postgres for Neon without rewriting a query, swap Stripe for Paddle without touching the handler. The contract is the API; the provider is an implementation detail."
        action={{ href: "/stack", label: "Browse the stack" }}
        bordered={true}
      />
      <ContractsGrid contracts={CONTRACTS} />
    </Section>
  )
}
