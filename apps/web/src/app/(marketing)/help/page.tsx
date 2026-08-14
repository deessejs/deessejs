import type { Metadata } from "next"
import Link from "next/link"

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
 */
export default function HelpPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Help
        </p>
        <h1 className="text-heading-56 tracking-tight">How to get help.</h1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Self-serve first, ask later. Most questions are answered in the
          Knowledge Base or the Docs. If not, the team is reachable through
          the channels below.
        </p>
      </header>

      <Section title="Self-serve">
        <BulletRow label="Knowledge Base" href="/knowledge-base">
          How-tos and reference material for common tasks.
        </BulletRow>
        <BulletRow
          label="Docs"
          href="https://docs.deessejs.com"
          external
        >
          The full DeesseJS reference. API, configuration, deployment.
        </BulletRow>
        <BulletRow label="Changelog" href="/changelog">
          Release notes and version history. Useful to confirm whether a bug
          you found is known and fixed.
        </BulletRow>
      </Section>

      <Section title="Community">
        <p className="text-copy-16 text-muted-foreground [&:not(:first-child)]:mt-0">
          Discussions and announcements live on the channels below. Use the
          one that fits the topic.
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            <ExternalLink href="https://github.com/deessejs/deessejs/discussions">
              GitHub discussions
            </ExternalLink>{" "}
            for questions, ideas, and show-and-tell.
          </li>
          <li className="list-disc">
            <ExternalLink href="https://github.com/deessejs/deessejs/issues">
              GitHub issues
            </ExternalLink>{" "}
            for confirmed bugs only.
          </li>
          <li className="list-disc">
            <ExternalLink href="https://x.com/deessejs">X</ExternalLink> and{" "}
            <ExternalLink href="https://www.linkedin.com/company/deessejs">
              LinkedIn
            </ExternalLink>{" "}
            for announcements.
          </li>
        </ul>
      </Section>

      <Section title="Email the team">
        <ul className="flex flex-col gap-2 text-copy-16">
          <li>
            <strong className="text-foreground">General:</strong>{" "}
            <MailLink href="mailto:support@deessejs.com">support@deessejs.com</MailLink>{" "}
            <span className="text-muted-foreground">
              questions, sales, anything else.
            </span>
          </li>
          <li>
            <strong className="text-foreground">Security:</strong>{" "}
            <MailLink href="mailto:support@deessejs.com">
              support@deessejs.com
            </MailLink>{" "}
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
            <MailLink href="mailto:support@deessejs.com">
              support@deessejs.com
            </MailLink>{" "}
            <span className="text-muted-foreground">
              student or OSS verification.
            </span>
          </li>
          <li>
            <strong className="text-foreground">Enterprise:</strong>{" "}
            <MailLink href="mailto:support@deessejs.com">
              support@deessejs.com
            </MailLink>{" "}
            <span className="text-muted-foreground">
              custom engagements, procurement.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Response times">
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            <strong className="text-foreground">General:</strong> two business
            days, Monday through Friday, business hours CET.
          </li>
          <li className="list-disc">
            <strong className="text-foreground">Security:</strong> acknowledged
            within 24 hours, triage within five business days.
          </li>
          <li className="list-disc">
            <strong className="text-foreground">Enterprise:</strong> two
            business days for a first reply.
          </li>
        </ul>
      </Section>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-24 tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function BulletRow({
  label,
  href,
  children,
  external,
}: {
  label: string
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
        >
          {label}
        </a>
      ) : (
        <Link
          href={href}
          className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
        >
          {label}
        </Link>
      )}
      <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
        {children}
      </p>
    </div>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </a>
  )
}

function MailLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="text-foreground underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </a>
  )
}
