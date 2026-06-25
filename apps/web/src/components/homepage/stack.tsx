import {
  Activity,
  Lock,
  Settings,
  Webhook,
  Zap,
} from "lucide-react"
import {
  SiDrizzle,
  SiHono,
  SiNextdotjs,
  SiPostgresql,
  SiReact,
  SiRedis,
  SiResend,
  SiShadcnui,
  SiStripe,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiZod,
} from "@icons-pack/react-simple-icons"

// All 18 technologies in the DeesseJS stack. Icons use simple-icons
// when available (proper brand SVGs), lucide-react as fallback for
// niche libraries not yet covered (oRPC, Trigger.dev, QStash,
// Better Auth, Zustand).
const stack = [
  // Frontend
  { name: "Next.js", Icon: SiNextdotjs },
  { name: "React 19", Icon: SiReact },
  { name: "TypeScript", Icon: SiTypescript },
  { name: "Tailwind CSS", Icon: SiTailwindcss },
  { name: "shadcn/ui", Icon: SiShadcnui },
  // Backend
  { name: "Hono", Icon: SiHono },
  { name: "oRPC", Icon: Zap },
  { name: "Trigger.dev", Icon: Activity },
  { name: "QStash", Icon: Webhook },
  // Data
  { name: "PostgreSQL", Icon: SiPostgresql },
  { name: "Drizzle ORM", Icon: SiDrizzle },
  { name: "Upstash Redis", Icon: SiRedis },
  // Auth & Payments
  { name: "Better Auth", Icon: Lock },
  { name: "Stripe", Icon: SiStripe },
  { name: "Zod", Icon: SiZod },
  // Comms & AI
  { name: "Resend", Icon: SiResend },
  { name: "Vercel AI SDK", Icon: SiVercel },
  { name: "Zustand", Icon: Settings },
]

/**
 * HomeStack — every technology wired into the DeesseJS template.
 *
 * Layout follows the Geist reference (Vercel-style): centered section,
 * H2 with tracking-tight, muted subtitle, flat logo row with flex-wrap.
 * Icons are 48px each, displayed without text labels (aria-label and
 * title attribute for accessibility and tooltips).
 *
 * Type sizes are Tailwind standard closest to the Geist tokens
 * (text-heading-32 → text-3xl, text-heading-40 → text-4xl,
 * text-copy-16 → text-base, text-copy-18 → text-lg,
 * text-copy-20 → text-xl). When the package's Geist typography
 * utilities are added to globals.css (per DESIGN.md §2.5), swap these
 * to the named tokens.
 */
export function HomeStack() {
  return (
    <section
      id="stack"
      className="grid gap-8 py-20 text-center"
    >
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Built on a modern stack
        </h2>
        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg lg:text-xl">
          Every technology you need to ship a SaaS, already wired and
          working together.
        </p>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 max-sm:px-6">
        {stack.map(({ name, Icon }) => (
          <Icon
            key={name}
            size={48}
            title={name}
            aria-label={name}
            color="currentColor"
            className="text-foreground transition-opacity hover:opacity-70"
          />
        ))}
      </div>
    </section>
  )
}