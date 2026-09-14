import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { H1, H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

import { APP_CONFIG } from "@/lib/app-config"
import {
  STACK_CATEGORY_LABELS,
  STACK_CATEGORY_ORDER,
  STACK_PROVIDERS,
  type StackCategory,
} from "@/lib/seo/stack"
import { buildStackItemListJsonLd } from "@/lib/seo/stack-jsonld"

export const metadata: Metadata = {
  title: "Stack",
  description:
    "The hosting, database, auth, queue, billing, observability, email, and ORM providers that ship with every DeesseJS app.",
  alternates: {
    canonical: "/stack",
  },
  openGraph: {
    title: "Stack",
    description:
      "The hosting, database, auth, queue, billing, observability, email, and ORM providers that ship with every DeesseJS app.",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: "/stack",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack",
    description:
      "The hosting, database, auth, queue, billing, observability, email, and ORM providers that ship with every DeesseJS app.",
  },
}

/**
 * Stack at /stack.
 *
 * Public, single-page reference for the providers that ship with
 * DeesseJS apps. Two audiences:
 *   - Humans: a fast "what runs where" overview, grouped by role,
 *     with links out to each provider's homepage.
 *   - Crawlers: a single ItemList JSON-LD node that enumerates
 *     the same providers as Service entries, published by the
 *     Organization (via `apps/web/src/lib/seo/organization.ts`).
 *
 * Layout:
 *   ┌─ Hero (title + lead) ───────────────────────────┐
 *   ├─ Grouped provider grid (one section per category) ─┤
 *   └─ Read-next nav to /about, /manifesto, /ecosystem ─┘
 *
 * The provider data lives in `apps/web/src/lib/seo/stack.ts` so
 * the same source feeds the JSON-LD factory and the visual
 * presentation. Order matches the editorial reading order;
 * `STACK_CATEGORY_ORDER` makes that explicit.
 */
export default function StackPage() {
  const itemListJsonLd = JSON.stringify(buildStackItemListJsonLd())

  const grouped = STACK_CATEGORY_ORDER.map((category) => ({
    category,
    providers: STACK_PROVIDERS.filter(
      (provider) => provider.category === category,
    ),
  })).filter((group) => group.providers.length > 0)

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <script
        type="application/ld+json"
        // ItemList JSON-LD. The publisher link is the global
        // Organization @id, so this list joins the same entity
        // graph that the root WebSite and every Article already
        // reference. See `lib/seo/stack-jsonld.ts` for the full
        // shape and the rationale on `itemListOrder`.
        dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Stack</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Stack
        </p>
        <H1>The providers that ship with every DeesseJS app.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
          Hosting, database, auth, queue, billing, observability,
          email, and ORM. Every template wires these in. None of
          them are locked in: each contract ships with a typed
          layer, so the same app runs against a different provider
          if you bring your own.
        </p>
      </header>

      <Separator />

      {grouped.map(({ category, providers }) => (
        <StackCategorySection
          key={category}
          category={category}
          providers={providers}
        />
      ))}

      <Separator />

      <nav aria-label="Related pages" className="flex flex-col gap-6">
        <H2>Read next</H2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/about"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              About
            </span>
            <span className="text-copy-13 text-muted-foreground">
              What DeesseJS is, who edits it, and how to reach us.
            </span>
          </Link>
          <Link
            href="/manifesto"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Manifesto
            </span>
            <span className="text-copy-13 text-muted-foreground">
              The beliefs that shape how DeesseJS builds software.
            </span>
          </Link>
          <Link
            href="/ecosystem"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Ecosystem
            </span>
            <span className="text-copy-13 text-muted-foreground">
              The apps, SDKs, and shared contracts that ship
              together.
            </span>
          </Link>
        </div>
      </nav>
    </article>
  )
}

function StackCategorySection({
  category,
  providers,
}: {
  category: StackCategory
  providers: ReadonlyArray<(typeof STACK_PROVIDERS)[number]>
}) {
  return (
    <section
      id={`stack-category-${category}`}
      className="flex flex-col gap-4"
      aria-labelledby={`stack-category-heading-${category}`}
    >
      <h2
        id={`stack-category-heading-${category}`}
        className="text-heading-32 tracking-tight"
      >
        {STACK_CATEGORY_LABELS[category]}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <StackProviderCard key={provider.slug} provider={provider} />
        ))}
      </div>
    </section>
  )
}

function StackProviderCard({
  provider,
}: {
  provider: (typeof STACK_PROVIDERS)[number]
}) {
  return (
    // The whole card is a single outbound link to the provider's
    // homepage. The Card stays as a plain <div> inside the anchor
    // (Next/Link and shadcn's Card are both wrappers, not anchors,
    // so nesting an <a> around the Card is the cleanest path).
    // The `ExternalLink` icon at the bottom of the card is a visual
    // affordance — outbound link patterns should telegraph that
    // the user is leaving the site. `aria-label` on the anchor
    // gives screen readers the destination context.
    <a
      id={`stack-${provider.slug}`}
      href={provider.homepage}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${provider.name} homepage (opens in a new tab)`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:bg-accent/30 group-focus-visible:bg-accent/30">
        <header className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background p-1.5"
          >
            <Image
              src={`/logos/${provider.logo}.svg`}
              alt=""
              width={24}
              height={24}
              className="size-6 dark:invert"
            />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-label-14 font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
              {provider.name}
            </span>
            <span className="text-label-13 text-muted-foreground">
              {provider.role}
            </span>
          </div>
        </header>
        <p className="text-copy-13 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
          {provider.blurb}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 text-label-13 text-muted-foreground transition-colors group-hover:text-foreground">
          <ExternalLink className="size-3 shrink-0" aria-hidden />
          Visit homepage
        </span>
      </Card>
    </a>
  )
}