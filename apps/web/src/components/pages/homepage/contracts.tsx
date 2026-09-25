import { Section } from "@/app/(marketing)/_components/section"
import { ContractsGrid } from "@/app/(marketing)/_components/contracts-grid"
import { CONTRACTS } from "@/lib/marketing/home-data"

/** Contracts — 3-col bento with mini-UI mockups + stack matrix. */
export function Contracts() {
  return (
    <Section>
      <div className="flex flex-col gap-2 p-6 border-b border-border">
        <p className="text-label-13 text-muted-foreground">Under the hood</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
          Six contracts. Open stack. Typed end-to-end.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          Auth, database, billing, jobs, storage, observability. Typed
          against whichever provider you bring. The contracts your agent
          reads. The integration you don&apos;t have to write.
        </p>
      </div>
      <ContractsGrid contracts={CONTRACTS} />
    </Section>
  )
}
