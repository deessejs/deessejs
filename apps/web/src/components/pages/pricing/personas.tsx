import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"

import { Cell } from "./_shared/cell"

/**
 * The four buyers the licensing model is built around. Free-tier floor
 * is intentional — most visitors will be here, and the copy is written
 * to acknowledge that.
 *
 * Copy is in the second person ("you") so the visitor reads about
 * their own situation, not a third-party profile. Each persona maps
 * to a tier they would gravitate toward.
 */
const PERSONAS = [
  {
    label: "Pro",
    title: "Independent developers",
    body: "Use the same Pro catalog and commercial-use rights for your own products and client work. Each developer who needs Pro gets an assigned seat.",
  },
  {
    label: "Teams",
    title: "Teams of any size",
    body: "Buy seats for the developers who need Pro. Every seat has the same features and rights, with no agency plan or client-work surcharge.",
  },
  {
    label: "Community",
    title: "Builders getting started",
    body: "Start with Community at no cost under the MIT license, and move to Pro when you need its additional catalog.",
  },
] as const

export function Personas() {
  return (
    <div className="border-b border-border">
      <Cell className="border-0 !p-0">
        <div className="flex flex-col gap-2 border-b border-border p-6">
          <p className="text-label-13 text-muted-foreground">Who buys what</p>
          <h2 className="text-heading-32 tracking-tight text-balance lg:text-heading-40">
            One Pro plan for individuals and teams.
          </h2>
        </div>
        <KbCardGrid className="md:grid-cols-2">
          {PERSONAS.map((persona) => (
            <Cell
              key={persona.label}
              className="group gap-3 transition-colors hover:bg-accent/40"
            >
              <span className="font-mono text-label-13 text-muted-foreground">
                {persona.label}
              </span>
              <h3 className="!m-0 text-heading-20 tracking-tight text-foreground">
                {persona.title}
              </h3>
              <p className="line-clamp-4 text-copy-14 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                {persona.body}
              </p>
            </Cell>
          ))}
        </KbCardGrid>
      </Cell>
    </div>
  )
}
