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
    label: "Primary",
    title: "Freelance engineer or boutique studio",
    body:
      "You bill clients $20k–$80k per project. You don't get paid to wire auth, billing webhooks, and audit logs from scratch. Use Professional to eliminate low-margin plumbing and ship production-grade architectures under your client's brand.",
  },
  {
    label: "Secondary",
    title: "In-house team at a startup past the weekend stage",
    body:
      "You charge Professional seats against engineering time saved, the same way you buy Vercel or Linear. Layer the Subscription on top when your team is shipping actively and you want every new template the day it lands.",
  },
  {
    label: "Tertiary",
    title: "Engineering team delivering client work",
    body:
      "You need 5 seats under a single organization key, the Commercial Extended License, and the Figma source file. Agency is built for this. Layer an engagement contract for procurement and dedicated support when your client is regulated.",
  },
  {
    label: "Floor",
    title: "Solo builder shipping a weekend project",
    body:
      "You use the Community templates for free, MIT-licensed. Cloning a Community template is the fastest way to see how a Professional codebase is structured before you commit.",
  },
] as const

export function Personas() {
  return (
    <div className="border-b border-border">
      <Cell className="!p-0 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">Who buys what</p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            The four buyers we built the licensing model around. Find
            the one closest to you.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-y-0">
          {PERSONAS.map((persona, index) => (
            <div
              key={persona.label}
              className={cn(
                "group border-border transition-colors hover:bg-accent/40",
                // Vertical separator on every card except the first
                // in each row (md+ uses 2 cols, so col 2 = index 1
                // and index 3).
                "border-b last:border-b-0 md:border-b-0",
                index % 2 === 1 && "md:border-l",
              )}
            >
              <Cell className="gap-3">
                <span className="text-label-13 font-mono text-muted-foreground">
                  {persona.label}
                </span>
                <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                  {persona.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-7 line-clamp-4 [&:not(:first-child)]:mt-0">
                  {persona.body}
                </p>
              </Cell>
            </div>
          ))}
        </div>
      </Cell>
    </div>
  )
}
