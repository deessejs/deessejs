import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Check,
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
  Zap,
} from "lucide-react"
import {
  SiDrizzle,
  SiNextdotjs,
  SiPostgresql,
  SiShadcnui,
  SiStripe,
  SiTailwindcss,
  SiTypescript,
} from "@icons-pack/react-simple-icons"

import { HomeFooter } from "@/components/footers/home-footer"
import { HomeHeader } from "@/components/headers/home-header"
import PixelBlast from "@/components/homepage/pixel-blast"
import { CodePreview } from "@/components/homepage/code-preview"

import { tiers } from "@/lib/pricing/data"

import Link from "next/link"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"
import { Button } from "@workspace/ui/components/ui/button"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Separator } from "@workspace/ui/components/ui/separator"
import { Card } from "@workspace/ui/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip"

// --- DONNÉES STATIQUES ---

const heroFeatures = [
  {
    icon: Rocket,
    title: "Authentication",
    description: "Email, OAuth, and passkeys with session management and 2FA, wired to a typed RPC layer so the frontend stays in sync without codegen.",
  },
  {
    icon: Bot,
    title: "Database & ORM",
    description: "Postgres with Drizzle for type-safe queries and zero runtime overhead. Schemas, migrations, and seed scripts are wired from day one.",
  },
  {
    icon: Code2,
    title: "Backend API",
    description: "Hono + oRPC gives you an end-to-end typed API without the codegen step. Add a new procedure and the client gets full IntelliSense.",
  },
  {
    icon: Layers,
    title: "Design system",
    description: "shadcn/ui primitives on semantic tokens, with dark mode, Geist-aligned typography, and a Tailwind v4 setup you can extend.",
  },
]

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
    description: "Hono + oRPC end-to-end typed API with permissions, rate limiting, and OpenAPI specs.",
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

const faqs = [
  {
    question: "What does \"agentic\" mean in DeesseJS?",
    answer: "Your AI agents are the executors, not just the users. Every surface in DeesseJS has a tool your agent calls: auth, billing, storage, jobs, notifications, API. Your agents run multi-step workflows against a complete, wired system — not a blank canvas.",
  },
  {
    question: "How is this different from supastarter or MakerKit?",
    answer: "They optimize AI for the developer — Claude Code, Cursor, Codex integration. DeesseJS optimizes the system for AI agents. Your agents don't just help you code — they run on DeesseJS, call the tools directly, and build your product while you sleep.",
  },
  {
    question: "What if DeesseJS doesn't work for my project?",
    answer: "14-day money-back guarantee — no questions asked. If your agents don't save you 3 months of development work in the first 14 days, email us for a full refund.",
  },
  {
    question: "Do I need to know how to prompt my agents?",
    answer: "You need to know what you want. The prompts and workflows are in the AI Agent Workflow Library (Team tier). Your agents handle the implementation.",
  },
  {
    question: "Is there a free version?",
    answer: "Yes — DeesseJS Lite. It's an open-source subset of the template, free to download, ships with auth + billing + the agent primitives. Try it before you buy the full template.",
  },
  {
    question: "What about DeesseJS Cloud?",
    answer: "Coming Q3 2026. It's the managed variant — your agents run on infrastructure we operate. Private beta opens before public launch.",
  },
  {
    question: "Can I use my own database and infrastructure?",
    answer: "Yes. DeesseJS is self-hosted by default — you own every line of code. Deploy on Vercel, Docker, your own infra. No vendor lock-in.",
  },
  {
    question: "When does the founder pricing close?",
    answer: "July 31, 2026. After that, regular pricing kicks in at $399 / $599 / $999. Founding-member ($99) is capped at 50 and closes when the cap hits.",
  },
]

const whyChoose = [
  {
    icon: Rocket,
    title: "Ship in days, not months",
    description: "Auth, billing, and infra are wired from day one. Skip the boilerplate and focus on the part of the product that actually matters.",
  },
  {
    icon: Bot,
    title: "Built for the agentic era",
    description: "First-class support for Claude Code, Cursor, and Codex. AGENTS.md, typed RPC, and tool primitives that agents can call directly.",
  },
  {
    icon: Shield,
    title: "Battle-tested architecture",
    description: "Patterns proven across hundreds of SaaS products. Multi-tenancy, billing, and observability wired in from the first commit.",
  },
  {
    icon: Code2,
    title: "Own every line of code",
    description: "Full source access, no vendor lock-in. Deploy on Vercel, Docker, or your own infrastructure — your codebase, your call.",
  },
  {
    icon: Lock,
    title: "Type-safe end-to-end",
    description: "Hono + oRPC + Drizzle give you a fully typed stack. Catch errors at compile time, not in production after a deploy.",
  },
  {
    icon: GitBranch,
    title: "Continuously maintained",
    description: "Regular updates with the latest framework versions, security patches, and new integrations. Lifetime updates, no recurring fees.",
  },
]

// --- PAGE PRINCIPALE ---

export default function HomePage() {
  const bodyContainerClass = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
  const sectionPadding = "py-24 sm:py-32"

  return (
    <div className="flex min-h-screen flex-col selection:bg-foreground selection:text-background">
      <main className="flex-1 border-x border-border/40 mx-auto w-full max-w-[1400px]">
        {/* HERO SECTION */}
        <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden py-24">
          {/* WebGL pixel-blast background */}
          <PixelBlast
            variant="square"
            pixelSize={4}
            color="#ffffff"
            patternScale={2}
            patternDensity={1}
            pixelSizeJitter={0}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid={false}
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.5}
            edgeFade={0.25}
            transparent
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}
          />

          <div className={`relative z-10 ${bodyContainerClass} flex max-w-4xl flex-col items-center text-center`}>
            <Link
              href="/blog/agents-are-now-first-class-developers"
              className="mb-8 flex items-center justify-center space-x-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-md transition-colors hover:bg-muted/50"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-foreground">Agents are now first-class developers</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            
            <h1 className="text-6xl md:text-heading-48 lg:text-heading-64 text-balance text-center max-w-6xl font-semibold tracking-tighter text-foreground">
              The SaaS template that never sleeps.
            </h1>

            <p className="mt-8 max-w-2xl text-pretty text-lg font-medium text-muted-foreground sm:text-xl">
              Every surface your agents need — auth, billing, jobs, storage, notifications, API — is already wired. Your agents don&apos;t start from scratch. They start from a complete system.
            </p>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-md transition-transform hover:scale-105"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full px-8 text-base font-medium shadow-sm backdrop-blur-md"
                nativeButton={false}
                render={<Link href="/docs" />}
              >
                <BookOpen className="h-4 w-4" />
                Read the docs
              </Button>
            </div>
            <p className="mt-6 text-sm font-medium text-muted-foreground/80">
              Free during beta · No credit card required
            </p>

            {/* Stack — 8 main techs, smaller */}
            <TooltipProvider delay={150}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6">
                {([
                  { name: "Next.js", Icon: SiNextdotjs },
                  { name: "TypeScript", Icon: SiTypescript },
                  { name: "Tailwind CSS", Icon: SiTailwindcss },
                  { name: "shadcn/ui", Icon: SiShadcnui },
                  { name: "PostgreSQL", Icon: SiPostgresql },
                  { name: "Drizzle ORM", Icon: SiDrizzle },
                  { name: "Better Auth", Icon: Lock },
                  { name: "Stripe", Icon: SiStripe },
                ] as const).map(({ name, Icon }) => (
                  <Tooltip key={name}>
                    <TooltipTrigger>
                      <Icon
                        size={20}
                        aria-label={name}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      />
                    </TooltipTrigger>
                    <TooltipContent>{name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {/* CodePreview — static IDE mockup */}
            <div className="mt-12 w-full max-w-4xl">
              <CodePreview />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className={`border-t border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mb-16 max-w-3xl">
              <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                Everything you need to scale.
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                Skip the boilerplate. We&apos;ve wired together the best tools in the ecosystem so you can focus on your product.
              </p>
            </div>

            {/* Hero tier — 2 cols × 2 rows = 4 cells, glued Vercel style */}
            <div className="grid divide-y divide-border/40 border border-border/40 bg-card/50 md:grid-cols-2 md:divide-x overflow-hidden rounded-2xl shadow-sm">
              {heroFeatures.map((feature) => (
                <div key={feature.title} className="group relative flex flex-col p-8 transition-colors hover:bg-muted/20">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                    <feature.icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mb-6 flex-1 text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <Button variant="link" className="mt-auto inline-flex h-auto w-fit items-center gap-1 p-0 text-sm font-medium text-foreground">
                    Explore feature
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Standard tier — 3 cols × 5 rows = 15 cells */}
            <div className="mt-12 grid divide-y divide-border/40 border border-border/40 bg-card/50 md:grid-cols-2 md:divide-x lg:grid-cols-3 overflow-hidden rounded-2xl shadow-sm">
              {standardFeatures.map((feature) => (
                <div key={feature.title} className="group flex flex-col p-6 transition-colors hover:bg-muted/20">
                  <div className="mb-3 flex items-center gap-3">
                    <feature.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <Button variant="link" className="mt-auto inline-flex h-auto w-fit items-center gap-1 self-start rounded-none p-0 text-sm font-medium text-foreground">
                    See more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE SECTION */}
        <section id="why" className={`border-t border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                Why choose a SaaS boilerplate?
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                The complete foundation you need to ship your SaaS — without spending months on infrastructure.
              </p>
            </div>

            <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {whyChoose.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col">
                  <Icon className="size-6 text-foreground" strokeWidth={1.75} />
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING TEASER — compact 3-card row linking to /pricing for full detail */}
        <section id="pricing" className={`border-t border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                One-time price. Lifetime access.
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                No subscriptions. Lock in the founder rate before it closes.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className="flex flex-col rounded-lg border bg-background p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold tracking-tight text-foreground">
                        {tier.name}
                      </span>
                      {tier.highlighted ? (
                        <Badge className="rounded-full border-transparent bg-foreground px-2 py-0.5 text-[10px] font-medium text-background [&_svg]:size-3 flex items-center gap-1">
                          <Zap className="size-3" aria-hidden />
                          Most popular
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <Separator className="my-4 bg-border" />

                  <div className="flex items-baseline gap-1 font-semibold">
                    <span className="text-base leading-none">$</span>
                    <span className="text-3xl leading-none tracking-tight">
                      {tier.founderPrice}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    one-time · lifetime updates
                  </p>

                  <ul className="mt-4 flex flex-col gap-1.5">
                    {tier.features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check
                          className="size-4 shrink-0 text-foreground"
                          aria-hidden
                        />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/pricing"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    See full pricing
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button
                variant="outline"
                className="h-9 gap-2 rounded-md px-6 text-sm font-medium"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                Compare all features
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className={`border-t border-border/40 bg-muted/10 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Questions, answered.
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                What &quot;agentic&quot; means, how the refund works, and where the founder pricing closes.
              </p>
            </div>
            <Accordion className="mx-auto mt-16 max-w-2xl w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question} className="border-border/50">
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline hover:text-foreground text-foreground/90 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className={`relative border-t border-border/40 overflow-hidden ${sectionPadding}`}>
          {/* Subtle glow behind CTA */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px] bg-foreground/20 rounded-full pointer-events-none"></div>
          
          <div className={`${bodyContainerClass} flex flex-col items-center text-center`}>
            <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-6xl">
              Ready to ship your agents?
            </h2>
            <p className="mt-6 max-w-2xl text-pretty text-lg font-medium text-muted-foreground sm:text-xl">
              Get started in minutes. No credit card required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-md transition-transform hover:scale-105"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                Get DeesseJS
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full px-8 text-base font-medium shadow-sm backdrop-blur-md"
                nativeButton={false}
                render={<Link href="/docs" />}
              >
                Read the docs
              </Button>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  )
}