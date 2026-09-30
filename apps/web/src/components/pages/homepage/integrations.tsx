import Link from "next/link"
import { ArrowUpRight, Code, Layers, Lock } from "lucide-react"

import { Section } from "@/app/(marketing)/_components/section"

/**
 * Integrations — 2-column layout.
 *
 * Left column (3fr): eyebrow + h2 + 4 bullets in the Vercel-style
 *   'icon + bold + descriptor' pattern.
 *
 * Right column (7fr): 8-tech grid (2 cols x 4 rows on desktop, 1
 *   col on mobile). Each card is a self-contained tile with its
 *   logo, name, one-line description, and a 'Learn more' link that
 *   routes to /stack/<slug>.
 *
 * The 3fr / 7fr ratio targets a 30/70 split (≈384px copy / ≈896px
 * grid at a 1280px viewport) — copy column fits the eyebrow + h2
 * + 4 bullets without compressing them, tech wall stays wide.
 *
 * Inspired by trigger.dev's 'True runtime freedom for developers'
 * section but adapted to this repo's design tokens: card chrome
 * uses the shared-border rectangle (border border-border bg-background)
 * so the section reads as part of the same shared-border rhythm
 * as every other section on the homepage.
 *
 * 8 technologies hardcoded. Every href resolves to /stack/<slug>
 * which is not yet a real route — the links 404 today and will
 * activate when the stack detail page ships.
 */

type Tech = {
  /** Brand slug that resolves to /public/logos/<slug>.svg. */
  logo: string
  /** Display name shown on the card. */
  name: string
  /** One-line positioning sentence — what the tech gives the user. */
  description: string
  /** Route segment for /stack/<slug>. */
  slug: string
}

const TECHS: ReadonlyArray<Tech> = [
  {
    logo: "nextdotjs",
    name: "Next.js",
    description: "The default surface for every Pro template, with server components, App Router, and the edge runtime.",
    slug: "nextjs",
  },
  {
    logo: "astro",
    name: "Astro",
    description: "Island architecture for marketing surfaces and docs sites that ship near-zero JS by default.",
    slug: "astro",
  },
  {
    logo: "react",
    name: "React",
    description: "The contract layer is React-typed. Any React-compatible framework consumes the same templates.",
    slug: "react",
  },
  {
    logo: "vuedotjs",
    name: "Vue",
    description: "Supported via the same oRPC procedure types. Bind the same contracts from a Vue front-end.",
    slug: "vue",
  },
  {
    logo: "vercel",
    name: "Vercel",
    description: "Default deploy target. Edge functions, ISR, and preview deployments out of the box.",
    slug: "vercel",
  },
  {
    logo: "cloudflare",
    name: "Cloudflare",
    description: "Workers, R2, Queues, D1. The templates deploy to Cloudflare without code changes.",
    slug: "cloudflare",
  },
  {
    logo: "postgresql",
    name: "Postgres",
    description: "Any wire-compatible host works. The Drizzle schema is the source of truth, ported anywhere.",
    slug: "postgres",
  },
  {
    logo: "stripe",
    name: "Stripe",
    description: "Default billing provider. Subscriptions, usage metering, and webhooks via the Billing contract.",
    slug: "stripe",
  },
]

export function Integrations() {
  return (
    <Section>
      <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] divide-y divide-border md:divide-y-0 md:divide-x">
        {/* Left column: copy + bullets */}
        <div className="flex flex-col justify-start gap-4 p-6 lg:gap-6 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Plays well with
          </p>
          <h2 className="max-w-md text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Bring the stack you already use.
          </h2>
          <p className="max-w-md text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Every template is wired against the 6 contracts, not a
            fixed set of brands. Run the frameworks, hosts, and
            providers your team already knows.
          </p>
          <ul className="flex flex-col gap-3 pt-2">
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex h-4 shrink-0 items-center [&_svg]:h-4 [&_svg]:w-auto"
                dangerouslySetInnerHTML={{ __html: "<svg data-git-stack=\"\" fill=\"none\" height=\"16\" viewBox=\"0 0 58 16\" width=\"58\"><mask height=\"16\" id=\"mask0_5741_4680\" maskUnits=\"userSpaceOnUse\" style=\"mask-type: alpha;\" width=\"16\" x=\"42\" y=\"0\"><path clip-rule=\"evenodd\" d=\"M44.5945 9.45197C44.8893 8.42444 44.8427 7.32898 44.4617 6.3302L44.4393 6.27288L44.4367 6.2663L42.3197 0.741067L42.315 0.729303C42.2418 0.545259 42.1346 0.378067 42 0.235908V0H58V16H42V12.6479L42.8276 12.0281L42.8381 12.0197C43.6848 11.3755 44.3009 10.4749 44.5945 9.45197Z\" fill=\"#D9D9D9\" fill-rule=\"evenodd\"></path></mask><g mask=\"url(#mask0_5741_4680)\"><g clip-path=\"url(#clip0_5741_4680)\"><path d=\"M58 2.99657V12.5L54 16L48 14V15.9806L44 11.5L54 12.5V3.5L58 2.99657ZM54 3.5L49 0V2.28686L43.5 4L42 5.56457V10.5L44 11.5V5.56457L54 3.5Z\" fill=\"#0078D4\"></path></g></g><mask height=\"16\" id=\"mask1_5741_4680\" maskUnits=\"userSpaceOnUse\" style=\"mask-type: alpha;\" width=\"16\" x=\"28\" y=\"0\"><path clip-rule=\"evenodd\" d=\"M28 15.3077V16H44V0H28.9702C29.9002 0 30.606 0.83754 30.4485 1.75409L28.2141 14.7541C28.1794 14.9564 28.1051 15.1434 28 15.3077Z\" fill=\"#D9D9D9\" fill-rule=\"evenodd\"></path></mask><g mask=\"url(#mask1_5741_4680)\"><g clip-path=\"url(#clip1_5741_4680)\"><path d=\"M43.5274 6.68664L43.5055 6.63069L41.3858 1.0989C41.3427 0.990478 41.2663 0.898505 41.1677 0.836175C41.069 0.774904 40.9539 0.745394 40.8379 0.751629C40.7219 0.757865 40.6106 0.799545 40.519 0.871043C40.4285 0.944593 40.3628 1.04426 40.3309 1.15647L38.8997 5.53519H33.1044L31.6732 1.15647C31.6421 1.04365 31.5763 0.943483 31.4851 0.870232C31.3935 0.798734 31.2822 0.757054 31.1662 0.750818C31.0502 0.744583 30.9351 0.774093 30.8364 0.835364C30.7379 0.897946 30.6616 0.989838 30.6182 1.09809L28.4946 6.62744L28.4735 6.68339C28.1683 7.48065 28.1307 8.3555 28.3662 9.17603C28.6016 9.99656 29.0975 10.7183 29.779 11.2324L29.7863 11.2381L29.8057 11.2519L33.0346 13.6699L34.6321 14.8789L35.6051 15.6136C35.7189 15.7 35.8579 15.7468 36.0008 15.7468C36.1437 15.7468 36.2827 15.7 36.3965 15.6136L37.3696 14.8789L38.967 13.6699L42.2154 11.2373L42.2235 11.2308C42.9034 10.7166 43.3981 9.99558 43.6332 9.17616C43.8684 8.35673 43.8312 7.48313 43.5274 6.68664Z\" fill=\"#E24329\"></path><path d=\"M43.5273 6.68681L43.5055 6.63086C42.4726 6.84286 41.4994 7.28033 40.6552 7.91204L36 11.432C37.5853 12.6313 38.9654 13.6733 38.9654 13.6733L42.2137 11.2407L42.2218 11.2342C42.9028 10.72 43.3982 9.99855 43.6337 9.17843C43.8691 8.35831 43.8318 7.48389 43.5273 6.68681Z\" fill=\"#FC6D26\"></path><path d=\"M33.0346 13.6729L34.632 14.8819L35.6051 15.6166C35.7189 15.703 35.8579 15.7498 36.0008 15.7498C36.1437 15.7498 36.2827 15.703 36.3965 15.6166L37.3695 14.8819L38.967 13.6729C38.967 13.6729 37.5852 12.6277 36 11.4316C34.4147 12.6277 33.0346 13.6729 33.0346 13.6729Z\" fill=\"#FCA326\"></path><path d=\"M31.3439 7.91187C30.5005 7.27886 29.5274 6.84024 28.4945 6.62744L28.4734 6.68339C28.1683 7.48065 28.1306 8.35549 28.3661 9.17602C28.6016 9.99656 29.0975 10.7183 29.7789 11.2324L29.7862 11.2381L29.8057 11.2519L33.0346 13.6699C33.0346 13.6699 34.4131 12.6279 36 11.4286L31.3439 7.91187Z\" fill=\"#FC6D26\"></path></g></g><mask height=\"16\" id=\"mask2_5741_4680\" maskUnits=\"userSpaceOnUse\" style=\"mask-type: alpha;\" width=\"16\" x=\"14\" y=\"0\"><path clip-rule=\"evenodd\" d=\"M14 14.7083C15.8412 13.0604 17 10.6655 17 8C17 5.3345 15.8412 2.93964 14 1.29168V0H30V16H14V14.7083Z\" fill=\"#D9D9D9\" fill-rule=\"evenodd\"></path></mask><g mask=\"url(#mask2_5741_4680)\"><path d=\"M29.0132 1.00004C29.0833 0.999103 29.1528 1.01411 29.2168 1.04401C29.2807 1.07391 29.3376 1.11798 29.3834 1.17313C29.4292 1.22827 29.4628 1.29315 29.4819 1.36322C29.501 1.43328 29.505 1.50683 29.4938 1.57869L27.4536 14.4338C27.4282 14.5911 27.3502 14.7341 27.2333 14.8376C27.1164 14.9411 26.9681 14.9986 26.8144 15H17.027C16.9118 15.0015 16.7999 14.96 16.7117 14.8831C16.6234 14.8062 16.5648 14.699 16.5464 14.5809L14.5062 1.58119C14.495 1.50932 14.499 1.43577 14.5181 1.36571C14.5372 1.29565 14.5708 1.23077 14.6166 1.17562C14.6624 1.12048 14.7193 1.07641 14.7832 1.04651C14.8472 1.0166 14.9167 1.0016 14.9868 1.00254L29.0132 1.00004ZM20.4224 10.2909H23.5463L24.3922 5.70409H19.6655L20.4224 10.2909Z\" fill=\"#2684FF\"></path><path d=\"M15.155 5.7041H19.6655L20.4224 10.2909H23.5463L27.235 14.8354C27.118 14.9403 26.969 14.9986 26.8144 15H17.0245C16.9094 15.0015 16.7975 14.96 16.7092 14.8831C16.621 14.8062 16.5624 14.699 16.5439 14.5809L15.155 5.7041Z\" fill=\"url(#paint0_linear_5741_4680)\"></path></g><g clip-path=\"url(#clip2_5741_4680)\"><path clip-rule=\"evenodd\" d=\"M8 0C3.58 0 0 3.57879 0 7.99729C0 11.5361 2.29 14.5251 5.47 15.5847C5.87 15.6547 6.02 15.4148 6.02 15.2049C6.02 15.0149 6.01 14.3851 6.01 13.7154C4 14.0852 3.48 13.2255 3.32 12.7757C3.23 12.5458 2.84 11.836 2.5 11.6461C2.22 11.4961 1.82 11.1262 2.49 11.1162C3.12 11.1062 3.57 11.696 3.72 11.936C4.44 13.1455 5.59 12.8057 6.05 12.5957C6.12 12.0759 6.33 11.726 6.56 11.5261C4.78 11.3262 2.92 10.6364 2.92 7.57743C2.92 6.70773 3.23 5.98797 3.74 5.42816C3.66 5.22823 3.38 4.40851 3.82 3.30888C3.82 3.30888 4.49 3.09895 6.02 4.1286C6.66 3.94866 7.34 3.85869 8.02 3.85869C8.7 3.85869 9.38 3.94866 10.02 4.1286C11.55 3.08895 12.22 3.30888 12.22 3.30888C12.66 4.40851 12.38 5.22823 12.3 5.42816C12.81 5.98797 13.12 6.69773 13.12 7.57743C13.12 10.6464 11.25 11.3262 9.47 11.5261C9.76 11.776 10.01 12.2558 10.01 13.0056C10.01 14.0752 10 14.9349 10 15.2049C10 15.4148 10.15 15.6647 10.55 15.5847C12.1381 15.0488 13.5182 14.0284 14.4958 12.6673C15.4735 11.3062 15.9996 9.67293 16 7.99729C16 3.57879 12.42 0 8 0Z\" fill=\"var(--geist-foreground)\" fill-rule=\"evenodd\"></path></g><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"paint0_linear_5741_4680\" x1=\"14.1121\" x2=\"21.7744\" y1=\"6.98861\" y2=\"12.7502\"><stop offset=\"0.18\" stop-color=\"#0052CC\"></stop><stop offset=\"1\" stop-color=\"#2684FF\"></stop></linearGradient><clipPath id=\"clip0_5741_4680\"><rect fill=\"white\" height=\"16\" transform=\"translate(42)\" width=\"16\"></rect></clipPath><clipPath id=\"clip1_5741_4680\"><rect fill=\"white\" height=\"16\" transform=\"translate(28)\" width=\"16\"></rect></clipPath><clipPath id=\"clip2_5741_4680\"><rect fill=\"white\" height=\"16\" width=\"16\"></rect></clipPath></defs></svg>\n" }}
              />
              <span>
                <strong>Deploy automatically</strong> from git or with
                the CLI. No extra config.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <Layers
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-foreground"
              />
              <span>
                <strong>Wide range</strong> support for the most
                popular frameworks and hosts.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <Code
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-foreground"
              />
              <span>
                <strong>Typed contracts</strong> at every boundary, so
                your agent and your IDE stay in sync.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <Lock
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-foreground"
              />
              <span>
                <strong>Bring your own auth</strong>: Better Auth,
                Clerk, Auth0, Lucia, or your own provider.
              </span>
            </li>
          </ul>
        </div>

        {/* Right column: 8-tech grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border md:border-t-0">
          {TECHS.map((tech) => (
            <Link
              key={tech.slug}
              href={`/stack/${tech.slug}`}
              className="group/tech relative flex flex-col gap-3 border-b border-r border-border p-6 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:p-8"
            >
              <ArrowUpRight
                aria-hidden
                className="absolute right-4 top-4 size-4 shrink-0 text-muted-foreground transition-colors group-hover/tech:text-foreground lg:right-6 lg:top-6"
              />
              <h3 className="flex items-center gap-2 pr-6 text-heading-20 font-medium tracking-tight text-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${tech.logo}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 dark:invert"
                  aria-hidden
                />
                {tech.name}
              </h3>
              <p className="text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                {tech.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
