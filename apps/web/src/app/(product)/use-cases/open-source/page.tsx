import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  CmsEditorMockup,
  QueueLogMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "Open source | DeesseJS",
  description:
    "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
}

/**
 * Standards for the OSS surface — license, public roadmap, public CLI,
 * accepted registry. None of these carry a brand logo, so we render
 * them through <UseCaseStack> (which falls back to a mono-letter chip
 * for unbranded entries) instead of <TechStackGrid> (which expects a
 * /logos/<slug>.svg resolve).
 *
 * Note: this is the only migrated use-case page that still uses
 * <UseCaseStack>. The component is intentionally retained for any
 * surface whose stack list isn't a permutation of brand logos — the
 * other 6 pages use the animated <TechStackGrid>.
 */
const STACK = [
  "MIT license",
  "Public roadmap",
  "deessejs CLI",
  "Accepted registry",
] as const

const STEPS = [
  {
    heading: "License and changelog, day one",
    body:
      "MIT license baked into every template. Changelog-driven releases, public roadmap. The boring things that make a project real.",
  },
  {
    heading: "Install with the public CLI",
    body:
      "Users run deessejs init. They do not need to know your internal toolchain. Updates flow back through the same registry.",
  },
  {
    heading: "Community contributions, same shape",
    body:
      "Templates ship with the same AGENTS.md and conventions. A contribution from outside your team lands in the same shape as one from inside.",
  },
] as const

const RELATED = [
  {
    slug: "saas-apps",
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
  },
  {
    slug: "internal-tools",
    title: "Internal tools",
    tagline:
      "Operator consoles that work behind SSO, on the same auth and contracts as your customer app.",
  },
  {
    slug: "landing-pages",
    title: "Landing pages",
    tagline:
      "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
  },
] as const

/**
 * First-party templates the org has built on this surface. Pre-launch,
 * so href="#" placeholders. Same 4-card / lg:grid-cols-4 grid as the
 * other migrated pages.
 */
const BUILT_TEMPLATES = [
  { slug: "oss-starter",      title: "oss-starter",      body: "MIT-licensed starter, branded README + CONTRIBUTING." },
  { slug: "changelog-driven", title: "changelog-driven", body: "Conventional commits → CHANGELOG → GitHub release, automated." },
  { slug: "registry-submit",  title: "registry-submit",  body: "PR flow to add a new template to the public registry." },
  { slug: "versioning-rules", title: "versioning-rules", body: "Semver + changesets, enforced at the registry level." },
] as const

/**
 * Four thematic clusters of capabilities for an open-source maintainer
 * (license hygiene, public CLI, community shape, release automation).
 * Same shape as /use-cases/saas-apps and /use-cases/ai-products.
 *
 * The two middle clusters (registry-cli, community-shapes) intentionally
 * have no mockup — they are the surface the registry ships, so a UI
 * preview would be self-referential. The cluster component falls back to
 * a quiet "preview unavailable" panel.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "license-and-changelog",
    iconName: "FileCode",
    title: "License + changelog, day one",
    lead:
      "The two things every real OSS project has, written into the template from the first commit.",
    rows: [
      {
        id: "mit-license",
        title: "MIT baked into every template",
        body:
          "Every template ships with an MIT LICENSE file in the right place, the right name. No copy-paste from a previous project, no half-licensed dep tree. The registry checks at template acceptance.",
      },
      {
        id: "changelog-driven",
        title: "CHANGELOG.md, generated",
        body:
          "Conventional commits flow into CHANGELOG.md on every release. Not a manual edit, not a stale bullet from 18 months ago. The release notes read like the project has been alive for years.",
      },
      {
        id: "public-roadmap",
        title: "Public roadmap, written into the repo",
        body:
          "Roadmap lives at docs/roadmap/ in the repo, versioned with the code. Users see what's coming without subscribing to a Notion page maintained by one person.",
      },
    ],
  },
  {
    id: "registry-cli",
    iconName: "Package",
    title: "The public registry CLI",
    lead:
      "Users install with one command and update with the same. They never need to learn the internal toolchain.",
    rows: [
      {
        id: "deessejs-init",
        title: "deessejs init — one command to scaffold",
        body:
          "Users run deessejs init <template>. The CLI resolves the version, scaffolds the project, installs deps. They never see a tarball URL, never edit a workflow file, never know what's underneath.",
      },
      {
        id: "versioned-updates",
        title: "Versioned updates, through the same path",
        body:
          "deessejs update bumps the user to the next template version, with the same changelog-style notes they get from any dependency. The update path is the install path — no separate upgrade ritual.",
      },
      {
        id: "registry-discovery",
        title: "Templates discoverable, not pinned in a doc",
        body:
          "deessejs list <query> resolves from the live registry, not from a hardcoded catalog. Templates appear when published, disappear when deprecated, version themselves naturally.",
      },
    ],
  },
  {
    id: "community-shapes",
    iconName: "Users",
    title: "Same shape across contributors",
    lead:
      "A PR from outside the team lands in the same shape as one from inside. Conventions outlive the original author.",
    rows: [
      {
        id: "agents-md",
        title: "AGENTS.md at the template root",
        body:
          "Every template ships with an AGENTS.md at the root, describing the conventions a contributor needs to know. An outside contributor reads it once and writes code the same way the inside team does.",
      },
      {
        id: "ci-checklist",
        title: "CI enforces the checklist",
        body:
          "Typecheck, lint, format, dependency audit — the same checklist runs on every PR, internal or external. A contribution that doesn't pass the checklist isn't a contribution.",
      },
      {
        id: "codeowners",
        title: "CODEOWNERS routes reviews correctly",
        body:
          "Each area has an owner — not always the same person, but always someone who knows the surface. An outside PR to the auth layer doesn't wait for a maintainer who never touched auth to review it.",
      },
    ],
  },
  {
    id: "release-automation",
    iconName: "GitBranch",
    title: "Releases that don't break",
    lead:
      "Tagged, tested, and announced through the channels the project already uses. No release-day scramble.",
    rows: [
      {
        id: "changesets",
        title: "Changesets, not guesswork",
        body:
          "Every PR carries a changeset. The release PR aggregates them; the maintainer reviews them; the registry publishes them. No 'oops, that was a breaking change' after the tag lands.",
      },
      {
        id: "version-bump",
        title: "Semver bumps, enforced",
        body:
          "Major, minor, patch — enforced at the registry level from the changeset content. A feat with a breaking change bumps major; a feat without breaking bumps minor. The version matches the change.",
      },
      {
        id: "announce",
        title: "GitHub release + published announcement",
        body:
          "The release job opens a GitHub release with the same notes the CHANGELOG carries, posts to the social channels the maintainer configures, and pings the consumers via the registry's update path.",
      },
    ],
  },
] as const

/**
 * Mockup map keyed by cluster.id.
 *   - CmsEditorMockup  → License + changelog (renders a CHANGELOG-shaped page)
 *   - QueueLogMockup    → Release automation (release pipelines)
 *   - registry-cli, community-shapes → undefined (self-referential surfaces;
 *     the cluster component falls back to "preview unavailable")
 */
const CLUSTER_MOCKUPS = {
  "license-and-changelog": <CmsEditorMockup />,
  "registry-cli":          undefined,
  "community-shapes":      undefined,
  "release-automation":    <QueueLogMockup />,
} as const

export default function OpenSourcePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <UseCaseHero
        category="Open source"
        title="Maintainer-friendly starters, versioned through the registry."
        body="MIT-licensed starters for OSS maintainers. Pin a version, ship your app, never touch the registry again unless you want to."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box — four capability clusters */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four sub-systems every OSS project needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Twelve capabilities grouped by the maintainer-side question
            they answer. Pick a cluster, read what you actually get,
            and ship it.
          </p>
        </div>
        <CapabilityClustersSection
          clusters={CAPABILITY_CLUSTERS}
          mockups={CLUSTER_MOCKUPS}
        />
      </section>

      {/* 3. Stack (Standards) — semantic eyebrow kept from the prior
          version. The other 4 migrated pages use "Stack"; the OSS
          surface is wider than brand logos (license, roadmap, CLI,
          registry acceptance) so "Standards" reads more honestly. */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Standards
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            What ships with every template.
          </h2>
        </div>
        <UseCaseStack items={[...STACK]} />
      </section>

      {/* 4. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How an OSS project ships.
          </h2>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((step, idx) => (
            <li
              key={step.heading}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 5. Built on this */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built on this
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Four templates, each on its own surface.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Production-ready starter templates, each deployed at its own
            URL. Used as the reference set for what the registry can ship.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border sm:divide-y-0 sm:divide-x sm:divide-border">
          {BUILT_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.slug}
              href="#"
              aria-label={`Visit ${tpl.slug}`}
              className="group flex flex-col transition-colors hover:bg-accent/40"
            >
              <div
                aria-hidden
                className="aspect-[16/10] w-full border-b border-border bg-muted/40 transition-colors group-hover:bg-muted/60"
              />
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="font-mono text-copy-16 font-medium text-foreground">
                  {tpl.title}
                </h3>
                <p className="text-copy-14 leading-6 text-muted-foreground">
                  {tpl.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Related */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Related use cases.
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {RELATED.map((item) => (
            <Link
              key={item.slug}
              href={`/use-cases/${item.slug}`}
              className="group flex flex-col gap-2 p-6 transition-colors hover:bg-accent/40 lg:p-8"
            >
              <p className="text-label-13 text-muted-foreground">Related</p>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="line-clamp-3 text-copy-14 leading-6 text-muted-foreground">
                {item.tagline}
              </p>
              <p className="inline-flex items-center gap-1 pt-1 text-label-13 text-foreground">
                Read more
                <ArrowRight
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
      </div>

      <FinalCta />
    </div>
  )
}
