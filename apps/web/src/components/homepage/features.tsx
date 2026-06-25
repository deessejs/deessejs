import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Code2,
  Database,
  FileText,
  Folder,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Rocket,
  Search,
  Server,
  Settings,
  Shield,
  Webhook,
} from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

// Hero features — 4 cells in a 2-col × 2-row grid. Each description is a
// 2-3 sentence value pitch: what ships + why it matters + how it stays
// extensible. Modeled on the supastarter homepage feature-card copy.
const heroFeatures = [
  {
    icon: Rocket,
    title: "Authentication",
    description:
      "Email, OAuth, and passkeys with session management and 2FA, wired to a typed RPC layer so the frontend stays in sync without codegen. Swap providers or write your own without touching the rest of the stack.",
  },
  {
    icon: Bot,
    title: "Database & ORM",
    description:
      "Postgres with Drizzle for type-safe queries and zero runtime overhead. Schemas, migrations, and seed scripts are wired from day one — no glue code to write, no surprises when you ship.",
  },
  {
    icon: Code2,
    title: "Backend API",
    description:
      "Hono + oRPC gives you an end-to-end typed API without the codegen step. Add a new procedure and the client gets full IntelliSense — no rebuild, no broken types, no drift between server and client.",
  },
  {
    icon: Layers,
    title: "Design system",
    description:
      "shadcn/ui primitives on semantic tokens, with dark mode, Geist-aligned typography, and a Tailwind v4 setup you can extend. The system is yours — copy, modify, or delete any primitive without breaking the rest.",
  },
]

// Standard features — 15 cells in a 3-col × 5-row grid. Each description is
// a single, value-dense sentence: which provider, which workflow, what ships.
const standardFeatures = [
  {
    icon: Shield,
    title: "Authentication",
    description: "Email, OAuth, passkeys, and magic links with 2FA and per-tenant session policies.",
  },
  {
    icon: Database,
    title: "Database",
    description: "Postgres with Drizzle ORM, migrations, and seed scripts wired from day one.",
  },
  {
    icon: Server,
    title: "Backend",
    description: "Hono + oRPC for an end-to-end typed API with permissions and OpenAPI specs out of the box.",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Resend + React Email templates with a live preview app for local development.",
  },
  {
    icon: Folder,
    title: "Storage",
    description: "S3-compatible providers (R2, AWS, MinIO) with presigned uploads and access helpers.",
  },
  {
    icon: GitBranch,
    title: "Git integration",
    description: "GitHub and GitLab webhooks with signed payloads and event normalization.",
  },
  {
    icon: MessageSquare,
    title: "Messaging",
    description: "In-app, email, and push notifications behind a unified delivery API.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Outbound dispatcher with retries and dead-letter handling, plus inbound verification helpers.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Multi-channel delivery with per-user preferences, quiet hours, and read state.",
  },
  {
    icon: Activity,
    title: "Observability",
    description: "Logs, metrics, and traces wired through OpenTelemetry-compatible exporters.",
  },
  {
    icon: Lock,
    title: "Security",
    description: "Row-level security, encryption at rest, and secrets management by default.",
  },
  {
    icon: Globe,
    title: "i18n",
    description: "Multi-language support with typed locale files and a translation workflow.",
  },
  {
    icon: FileText,
    title: "Docs",
    description: "Fumadocs-powered site with full-text search, MDX, and AI-assisted actions.",
  },
  {
    icon: Search,
    title: "Search",
    description: "Full-text and faceted search backed by Postgres or your preferred provider.",
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Per-tenant configuration with type-safe defaults and admin overrides.",
  },
]

/**
 * HomeFeatures — two-tier feature grid, cells glued edge-to-edge.
 *
 *   1. Hero tier: 2-col × 2-row grid (4 cells). Bigger descriptions (2-3
 *      sentence value pitches). Title text-lg + font-semibold, description
 *      text-base + leading-relaxed.
 *   2. Standard tier: 3-col × 5-row grid (15 cells). Compact descriptions
 *      (single value-dense sentence). Title text-base, description text-sm
 *      + leading-relaxed.
 *
 * No section padding, no horizontal padding inside the section, no margin
 * between the title block and the hero grid, or between the hero grid
 * and the standard grid. Cells sit flush against each other — no `gap-*`
 * between them, no rounded corners (would overlap), no ring (would double
 * up at the seams). The only visual separators between cells are the 1px
 * dividers from `divide-x` / `divide-y` on the grid container. The bg-card
 * background of each cell does the rest of the visual work against the
 * page's bg-background.
 *
 * Each cell carries a "See more" CTA in its footer. The CardFooter's
 * default `border-t` and `bg-muted/50` are overridden to keep the glued
 * look — the footer is just a padded slot at the bottom of the cell, with
 * `mt-auto` pushing the button down so all buttons in a row align.
 *
 * Dummy copy modeled on the supastarter homepage feature-card pattern
 * (value-driven, peer-to-peer voice). Replace with the real feature
 * inventory when the marketing content is finalized.
 */
export function HomeFeatures() {
  return (
    <section id="features">
      <div className="mx-auto w-full max-w-7xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Section title goes here
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Optional subtitle that frames the value of the section.
          </p>
        </div>

        {/* Hero tier — 2 cols × 2 rows = 4 cells, glued */}
        <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x">
          {heroFeatures.map((feature) => (
            <Card key={feature.title} className="rounded-none ring-0">
              <CardHeader>
                <feature.icon className="size-6 text-foreground" />
                <CardTitle className="mt-2 text-lg leading-tight font-semibold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto rounded-none border-0 bg-transparent">
                <Button variant="link" size="sm" className="h-auto gap-1 rounded-none px-0">
                  See more
                  <ArrowRight />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Standard tier — 3 cols × 5 rows = 15 cells, glued */}
        <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x lg:grid-cols-3">
          {standardFeatures.map((feature) => (
            <Card key={feature.title} size="sm" className="rounded-none ring-0">
              <CardHeader>
                <feature.icon className="size-5 text-foreground" />
                <CardTitle className="mt-1.5 text-base leading-snug">
                  {feature.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto rounded-none border-0 bg-transparent">
                <Button variant="link" size="xs" className="h-auto gap-1 rounded-none px-0">
                  See more
                  <ArrowRight />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}