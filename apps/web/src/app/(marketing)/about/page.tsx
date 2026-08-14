import Link from "next/link"
import type { Metadata } from "next"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { H1, H2 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

export const metadata: Metadata = {
  title: "About",
  description:
    "What DeesseJS is, who edits it, and how to get in touch.",
}

/**
 * About page at /about.
 *
 * Three-section narrative, matching the shape of /manifesto,
 * /principles, /vision, /ecosystem:
 *   1. The main app — what DeesseJS is for the org
 *   2. Edited by Nesalia Inc. — the open model
 *   3. Get in touch — channels
 *
 * Copy is placeholder, written in DeesseJS's voice (agentic,
 * modern stack, opinionated defaults). Mirrors the conceptual
 * split documented in
 * `docs/engineering/plans/deessejs-main-app-repositioning.md`:
 * Nesalia Inc. is the editor, the DeesseJS org is the project.
 */

const CHANNELS: ReadonlyArray<{
  label: string
  href: string
  body: string
}> = [
  {
    label: "GitHub",
    href: "https://github.com/deessejs",
    body:
      "Issues, PRs, and discussions live on the deessejs org. The Add Template Issue Template is the entry point for contributing a starter to the registry.",
  },
  {
    label: "Security",
    href: "mailto:support@deessejs.com",
    body:
      "Report a vulnerability privately to support@deessejs.com. Sensitive issues stay out of the public tracker until a fix is ready.",
  },
  {
    label: "Press & partnerships",
    href: "mailto:support@deessejs.com",
    body:
      "For press, conference talks, sponsorship, or anything else where an email beats an issue.",
  },
] as const

export default function AboutPage() {
  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>About</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero */}
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          About
        </p>
        <H1>The main app.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
          DeesseJS is the main app of the deessejs organization —
          the surface that holds the templates, the contracts, the
          tools, and the team&apos;s voice in one place. This page
          is the short version of who edits it, and how to reach
          us.
        </p>
      </header>

      <Separator />

      {/* 1. The main app */}
      <section className="flex flex-col gap-3">
        <H2>The main app</H2>
        <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          The deessejs org runs more than one product. There are the
          templates you can scaffold today, the contracts they all
          share, the SDKs and CLI you install them through, and a
          small set of sub-domain products that ship on the same
          defaults. DeesseJS is the surface that ties them together
          and tells the world what the org is for.
        </p>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          When a new template is published, when a contract
          version bumps, when the CLI gains a flag — DeesseJS is
          where it shows up first. The marketing site, the docs
          surface, and the registry all read from the same source
          of truth, so a release on one side reaches every surface
          on the other.
        </p>
      </section>

      {/* 2. Edited by Nesalia Inc. */}
      <section className="flex flex-col gap-3">
        <H2>Edited by Nesalia Inc.</H2>
        <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          DeesseJS is published by Nesalia Inc., a small company
          that funds the work and owns the brand. The
          templates, contracts, CLI, and sub-domain apps are MIT.
          The brand, the curated registry, and the marketplace
          positioning stay ours.
        </p>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          That split is intentional. The source-code ecosystem is
          shared — anyone can fork, ship, and contribute back. The
          product surface is owned — a single team gets to
          curate the registry, set the defaults, and steward what
          ships under the DeesseJS name.
        </p>
      </section>

      {/* 3. Get in touch */}
      <section className="flex flex-col gap-3">
        <H2>Get in touch</H2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          Three channels, by purpose. Pick the one that matches
          what you&apos;re bringing.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={
                channel.href.startsWith("http") ? "_blank" : undefined
              }
              rel={
                channel.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
            >
              <span className="text-label-14 font-semibold tracking-tight text-foreground">
                {channel.label}
              </span>
              <span className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
                {channel.body}
              </span>
            </a>
          ))}
        </div>
      </section>

      <Separator />

      {/* Cross-link CTA */}
      <nav
        aria-label="Related pages"
        className="flex flex-col gap-6"
      >
        <H2>Read next</H2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/manifesto"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Manifesto
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Why we&apos;re here — the beliefs behind the work.
            </span>
          </Link>
          <Link
            href="/principles"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Principles
            </span>
            <span className="text-copy-13 text-muted-foreground">
              How we work, day to day.
            </span>
          </Link>
          <Link
            href="/vision"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Vision
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Where this is going next.
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
              The sub-domains and shared values.
            </span>
          </Link>
        </div>
      </nav>
    </article>
  )
}