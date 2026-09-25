import type { Metadata } from "next"
import Link from "next/link"

import { Separator } from "@workspace/ui/components/separator"

import { RelatedLinks } from "@/components/pages/_shared/related-links"

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to get help with DeesseJS. Self-serve first, ask later.",
}

/**
 * Help page at /help.
 *
 * Self-serve first, ask later. Most questions are answered in the
 * Knowledge Base or the Docs. For everything else, the team is
 * reachable through the channels below.
 *
 * Archetype note: unlike /about, /manifesto, /principles, /vision
 * which use a single H1 with section H2s, /help uses a single H1
 * followed by H2 section headings. The four local helpers that
 * used to live at the bottom of this file (`Section`, `BulletRow`,
 * `ExternalLink`, `MailLink`) were removed in favour of inlining:
 * the section shape is simple enough that 3 inline <section> blocks
 * are clearer than a custom helper, and the link shapes (Link,
 * external <a target="_blank">, mailto) are unique to this page.
 */
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Help
        </p>
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
          How to get help.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Self-serve first, ask later. Most questions are answered in the
          Knowledge Base or the Docs. If not, the team is reachable through
          the channels below.
        </p>
      </header>

      <Separator />

      {/* Self-serve */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          Self-serve
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Link
              href="/knowledge-base"
              className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Knowledge Base
            </Link>
            <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
              How-tos and reference material for common tasks.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <a
              href="https://docs.deessejs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Docs
            </a>
            <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
              The full DeesseJS reference. API, configuration, deployment.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href="/changelog"
              className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Changelog
            </Link>
            <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
              Release notes and version history. Useful to confirm whether a bug
              you found is known and fixed.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Community */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          Community
        </h2>
        <p className="text-copy-16 text-muted-foreground [&:not(:first-child)]:mt-0">
          Discussions and announcements live on the channels below. Use the
          one that fits the topic.
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            <a
              href="https://github.com/deessejs/deessejs/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              GitHub discussions
            </a>{" "}
            for questions, ideas, and show-and-tell.
          </li>
          <li className="list-disc">
            <a
              href="https://github.com/deessejs/deessejs/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              GitHub issues
            </a>{" "}
            for confirmed bugs only.
          </li>
          <li className="list-disc">
            <a
              href="https://x.com/deessejs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              X
            </a>{" "}
            and{" "}
            <a
              href="https://www.linkedin.com/company/deessejs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              LinkedIn
            </a>{" "}
            for announcements.
          </li>
        </ul>
      </section>

      <Separator />

      {/* Email the team */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          Email the team
        </h2>
        <ul className="flex flex-col gap-2 text-copy-16">
          <li>
            <strong className="text-foreground">General:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>{" "}
            <span className="text-muted-foreground">
              questions, sales, anything else.
            </span>
          </li>
          <li>
            <strong className="text-foreground">Security:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>{" "}
            <span className="text-muted-foreground">
              vulnerability reports. See{" "}
              <Link
                href="/security"
                className="underline underline-offset-4 hover:text-foreground"
              >
                security policy
              </Link>{" "}
              for disclosure rules.
            </span>
          </li>
          <li>
            <strong className="text-foreground">Pro Education:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>{" "}
            <span className="text-muted-foreground">
              student or OSS verification.
            </span>
          </li>
          <li>
            <strong className="text-foreground">Enterprise:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>{" "}
            <span className="text-muted-foreground">
              custom engagements, procurement.
            </span>
          </li>
        </ul>
      </section>

      <Separator />

      {/* Response times */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          Response times
        </h2>
        <dl className="flex flex-col gap-2 text-copy-16 text-muted-foreground">
          <div>
            <dt className="font-semibold text-foreground">General</dt>
            <dd>
              two business days, Monday through Friday, business hours CET.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Security</dt>
            <dd>acknowledged within 24 hours, triage within five business days.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Enterprise</dt>
            <dd>two business days for a first reply.</dd>
          </div>
        </dl>
      </section>

      <Separator />

      {/* Cross-link CTA */}
      <RelatedLinks
        links={[
          {
            label: "About",
            href: "/about",
            body: "Who edits the project, and how to reach us.",
          },
          {
            label: "Manifesto",
            href: "/manifesto",
            body: "The beliefs behind the work.",
          },
          {
            label: "Knowledge Base",
            href: "/knowledge-base",
            body: "How-tos and reference material for common tasks.",
          },
          {
            label: "Documentation",
            href: "https://docs.deessejs.com",
            body: "The full API and configuration reference.",
            external: true,
          },
        ]}
      />
    </div>
  )
}
