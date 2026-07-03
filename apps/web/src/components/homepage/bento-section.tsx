import {
  ArrowRight,
  Bell,
  Building2,
  Database,
  FileText,
  GitBranch,
  Languages,
  Mail,
  type LucideIcon,
  MessageSquare,
  Webhook,
} from "lucide-react"

import { ResendMark } from "@/components/marketing/brand-marks"

import { cn } from "@workspace/ui/lib/utils"
import { DOCS_URL } from "@/lib/urls"

/**
 * BentoSection — secondary features grid below the 4 capability pillars.
 *
 * The pillars cover the headline capabilities (Auth, Billing,
 * Observability, DX). The bento covers the supporting features that
 * complete the picture — Email, Storage, Search, Docs, Webhooks, Git,
 * Notifications, i18n, Multi-tenant. Each cell pairs a claim with the
 * tech it ships with (brand marks + lucide icons).
 *
 * Pattern per Brainy Bento Playbook (April 2026): asymmetric grid with
 * two 2×2 hero cells (Email + Docs) and seven 1×1 supporting cells. 9
 * cells total.
 *
 * Grid math (3 columns, 5 rows):
 *   row 1-2: [Email 2x2 cols 1-2] [Storage r1] [Search r2]
 *   row 3-4: [Docs  2x2 cols 1-2] [Webhooks r3] [Git r4]
 *   row 5:   [Notif] [i18n] [Multi-tenant]
 *
 * Two 2×2 heroes (Email + Docs) create visual symmetry. The right column
 * carries the vertical flow. The bottom row is three small cells at
 * equal weight.
 *
 * Cell anatomy:
 *   - Title (text-base/lg font-semibold)
 *   - 1-sentence body (text-sm text-muted-foreground)
 *   - Tech row (lucide icons + brand marks, 18px)
 *   - Hero cells (Email, Docs) include a mini visual that justifies
 *     their 2×2 size
 *
 * Visual rules (mono DeesseJS):
 *   - No per-cell colored backgrounds — uniform bg-card/50
 *   - Hairline borders only (border-border/40)
 *   - Brand marks stay mono unless they have a brand color (Resend = mono)
 *   - Hover: subtle bg-muted/20 (no shadows)
 */

interface TechIcon {
  /** Lucide icon component (for generic tech without a brand mark). */
  Icon?: LucideIcon
  /** Brand mark component (for tech we have a logo for). */
  Mark?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Human-readable name, used for tooltip / a11y. */
  name: string
}

interface BentoCell {
  title: string
  body: string
  tech: TechIcon[]
  /** External docs URL — opens in new tab. */
  href: string
}

const EMAIL_INBOX = [
  {
    from: "deessejs",
    subject: "Welcome to Acme",
    time: "12:42",
  },
  {
    from: "stripe",
    subject: "Invoice INV-0047 paid",
    time: "11:18",
  },
  {
    from: "team",
    subject: "New comment on #pricing",
    time: "10:03",
  },
  {
    from: "system",
    subject: "Trial ends in 3 days",
    time: "09:30",
  },
]

const DOCS_NAV = [
  { label: "Quickstart", active: true },
  { label: "Auth", active: false },
  { label: "Billing", active: false },
  { label: "Database", active: false },
  { label: "Webhooks", active: false },
  { label: "Storage", active: false },
  { label: "Notifications", active: false },
]

interface BentoCardProps extends BentoCell {
  className?: string
}

/**
 * HoverSlideArrow — small ArrowRight that slides in from the left on
 * group hover. Per the user's pick (Q3=a + "with lucide"): uses
 * lucide-react ArrowRight, slides in next to the card title.
 *
 * Defaults: opacity-0, -translate-x-1
 * On `group-hover`: opacity-100, translate-x-0, color → text-foreground
 */
function HoverSlideArrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      className={cn(
        "size-4 shrink-0 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-foreground",
        className,
      )}
      aria-hidden
    />
  )
}

function BentoCard({ title, body, tech, href, className }: BentoCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-colors hover:border-foreground/20 hover:bg-muted/20",
        className,
      )}
    >
      <div className="flex items-baseline gap-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h3>
        <HoverSlideArrow />
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-4 flex items-center gap-2 text-muted-foreground/70">
        {tech.map((t) => {
          if (t.Mark) {
            return (
              <t.Mark
                key={t.name}
                width={18}
                height={18}
                aria-label={t.name}
                className="transition-colors group-hover:text-foreground"
              />
            )
          }
          if (t.Icon) {
            return (
              <t.Icon
                key={t.name}
                width={18}
                height={18}
                aria-label={t.name}
                className="transition-colors group-hover:text-foreground"
              />
            )
          }
          return null
        })}
        <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          {tech.map((t) => t.name).join(" · ")}
        </span>
      </div>
    </a>
  )
}

export function BentoSection() {
  return (
    <div className="mt-24">
      {/* Section header */}
      <div className="mb-12 max-w-3xl">
        <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Everything else, also wired.
        </h2>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          Email, storage, search, docs, webhooks, i18n, Git, notifications.
          Each one ships pre-configured, not as a TODO.
        </p>
      </div>

      {/* Bento grid — 3 columns, asymmetric */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[180px]">
        {/* Email hero — 2×2 with inbox mockup */}
        <a
          href={`${DOCS_URL}/email`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-colors hover:border-foreground/20 hover:bg-muted/20 md:col-span-2 md:row-span-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Email that ships
              </h3>
              <HoverSlideArrow className="size-5" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Day 0
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Resend + React Email templates, with a live preview app for local
            development. Bounce, open, and click tracking wired in.
          </p>

          {/* Mini inbox mockup */}
          <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-border/40 bg-background">
            <div className="border-b border-border/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Inbox · 4 messages
            </div>
            <div>
              {EMAIL_INBOX.map((mail) => (
                <div
                  key={mail.subject}
                  className="flex items-center gap-3 border-b border-border/20 px-3 py-1.5 last:border-b-0"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold text-foreground">
                    {mail.from.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="w-20 shrink-0 truncate font-mono text-[11px] text-muted-foreground">
                    {mail.from}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">
                    {mail.subject}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {mail.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-muted-foreground/70">
            <ResendMark
              width={18}
              height={18}
              aria-label="Resend"
              className="transition-colors group-hover:text-foreground"
            />
            <Mail
              width={18}
              height={18}
              aria-label="React Email"
              className="transition-colors group-hover:text-foreground"
            />
            <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Resend · React Email
            </span>
          </div>
        </a>

        {/* Storage — 1×1 */}
        <BentoCard
          title="S3-compatible storage"
          body="R2, AWS, MinIO — presigned uploads and access helpers included."
          href={`${DOCS_URL}/storage`}
          tech={[
            { Icon: Database, name: "R2" },
            { Icon: Database, name: "S3" },
            { Icon: Database, name: "MinIO" },
          ]}
        />

        {/* Search — 1×1 */}
        <BentoCard
          title="Full-text search"
          body="Postgres FTS or your provider — faceted, typo-tolerant."
          href={`${DOCS_URL}/search`}
          tech={[{ Icon: Database, name: "Postgres" }]}
        />

        {/* Docs — 2×2 hero with sidebar preview (matches Email's weight) */}
        <a
          href={`${DOCS_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-colors hover:border-foreground/20 hover:bg-muted/20 md:col-span-2 md:row-span-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Docs that ship
              </h3>
              <HoverSlideArrow className="size-5" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Fumadocs
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Full-text search, MDX, AI-assisted actions. The buyer-facing docs
            site lives in the same monorepo.
          </p>

          {/* Mini docs preview — now has 2×2 worth of vertical space */}
          <div className="mt-3 flex flex-1 gap-0 overflow-hidden rounded-lg border border-border/40 bg-background">
            <div className="w-32 shrink-0 border-r border-border/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Docs
              </div>
              <div className="mt-2 space-y-1">
                {DOCS_NAV.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded px-2 py-1 text-[12px]",
                      item.active
                        ? "bg-foreground/5 font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2 p-3">
              <div className="flex items-center gap-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Quickstart
                </div>
                <div className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                  3 min
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-3/4 rounded bg-foreground/10" />
                <div className="h-2 w-2/3 rounded bg-foreground/10" />
                <div className="h-2 w-5/6 rounded bg-foreground/10" />
              </div>
              <div className="mt-3 rounded border border-border/40 bg-muted/20 p-2">
                <div className="font-mono text-[10px] text-foreground">
                  $ pnpm create deessejs
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-1/2 rounded bg-foreground/15" />
                <div className="h-2 w-3/5 rounded bg-foreground/15" />
                <div className="h-2 w-2/5 rounded bg-foreground/15" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-muted-foreground/70">
            <FileText
              width={18}
              height={18}
              aria-label="Fumadocs"
              className="transition-colors group-hover:text-foreground"
            />
            <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Fumadocs · MDX · AI
            </span>
          </div>
        </a>

        {/* Webhooks — 1×1, top-right of Docs */}
        <BentoCard
          title="Webhooks in & out"
          body="Outbound dispatcher with retries. Inbound verification helpers."
          href={`${DOCS_URL}/webhooks`}
          tech={[
            { Icon: Webhook, name: "Outbound" },
            { Icon: GitBranch, name: "Inbound" },
          ]}
        />

        {/* Git — 1×1, bottom-right of Docs */}
        <BentoCard
          title="Git integration"
          body="GitHub and GitLab webhooks with signed payloads and event normalization."
          href={`${DOCS_URL}/git`}
          tech={[
            { Icon: GitBranch, name: "GitHub" },
            { Icon: GitBranch, name: "GitLab" },
          ]}
        />

        {/* Notifications — 1×1, bottom row */}
        <BentoCard
          title="Notifications"
          body="In-app, email, and push behind one delivery API with preferences."
          href={`${DOCS_URL}/notifications`}
          tech={[
            { Icon: Mail, name: "Email" },
            { Icon: Bell, name: "Push" },
            { Icon: MessageSquare, name: "In-app" },
          ]}
        />

        {/* i18n — 1×1, bottom row */}
        <BentoCard
          title="Multi-language"
          body="Typed locale files and a translation workflow, ready to ship."
          href={`${DOCS_URL}/i18n`}
          tech={[
            { Icon: Languages, name: "EN" },
            { Icon: Languages, name: "JA" },
            { Icon: Languages, name: "FR" },
          ]}
        />

        {/* Multi-tenant — 1×1, bottom row */}
        <BentoCard
          title="Multi-tenant"
          body="Per-tenant data isolation, org switching, role-based access."
          href={`${DOCS_URL}/multi-tenant`}
          tech={[
            { Icon: Building2, name: "Orgs" },
            { Icon: Database, name: "RLS" },
            { Icon: MessageSquare, name: "RBAC" },
          ]}
        />
      </div>
    </div>
  )
}