import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { USE_CASES } from "../_data"

type Params = { slug: string }

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { slug } = await params
  const meta = USE_CASES[slug]
  if (!meta) return { title: "Use case not found" }
  return { title: meta.title, description: meta.tagline }
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const meta = USE_CASES[slug]
  if (!meta) notFound()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 lg:gap-32 lg:py-24">
      {/* 1. Hero */}
      <section className="flex flex-col items-center gap-6 pt-12 text-center lg:pt-24">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Use case
        </p>
        <h1 className="text-heading-72 tracking-tight text-balance max-w-4xl">
          {meta.title}
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl text-balance [&:not(:first-child)]:mt-0">
          {meta.tagline}
        </p>
        <p className="text-copy-16 text-foreground leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
          {meta.outcome}
        </p>
        <pre className="mt-4 rounded-md border border-border bg-muted/40 px-4 py-2 text-copy-14-mono text-foreground">
          <code>
            {meta.installCommand ?? "deessejs init"}{" "}
            {meta.installHint ?? ""}
          </code>
        </pre>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {meta.starterSlug ? (
            <Link
              href={`/templates/${meta.starterSlug}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-button-16 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View template
            </Link>
          ) : null}
          <Link
            href="/templates"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-button-16 font-medium text-foreground transition-colors hover:bg-accent/30"
          >
            All templates
          </Link>
        </div>
      </section>

      <hr className="border-border" />

      {/* 2. What you get (3-feature row) */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What you get
          </p>
          <h2 className="text-heading-32 tracking-tight">
            Three reasons to start here.
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {meta.features3.map((feature) => (
            <div
              key={feature.title}
              className="flex h-full flex-col gap-3 rounded-md border border-border bg-background p-6"
            >
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                {feature.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {feature.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* 3. What you ship */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What you ship
          </p>
          <h2 className="text-heading-32 tracking-tight">
            Out of the box, on day one.
          </h2>
          <p className="text-muted-foreground text-copy-16 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
            Three concrete deliverables the template wires for you, with
            the same contracts the rest of your app consumes.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {meta.outcomes.map((outcome) => (
            <div
              key={outcome.name}
              className="flex h-full flex-col gap-3 rounded-md border border-border bg-background p-6"
            >
              <span
                className={
                  outcome.status === "shipped"
                    ? "inline-flex w-fit items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-label-13 text-emerald-700 dark:text-emerald-400"
                    : "inline-flex w-fit items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-label-13 text-amber-700 dark:text-amber-400"
                }
              >
                {outcome.status === "shipped" ? "Shipped" : "Coming soon"}
              </span>
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                {outcome.name}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {outcome.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* 4. Stack map (ASCII) */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            How it wires together
          </p>
          <h2 className="text-heading-32 tracking-tight">
            The shape of the stack.
          </h2>
          <p className="text-muted-foreground text-copy-16 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
            A read-only map of how the pieces connect. Each box is a
            component you can swap; the arrows are contracts you can
            extend.
          </p>
        </header>
        <div className="rounded-md border border-border bg-background p-6">
          <pre className="overflow-x-auto text-copy-13-mono leading-relaxed text-foreground whitespace-pre">
            {meta.stackMap}
          </pre>
        </div>
      </section>

      <hr className="border-border" />

      {/* 5. Built with (chip row) */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built with
          </p>
          <h2 className="text-heading-32 tracking-tight">
            The stack, in plain text.
          </h2>
        </header>
        <div className="flex flex-wrap gap-2">
          {meta.stack.map((item) => (
            <span
              key={item}
              className="rounded-md border border-border px-4 py-2 text-label-14 text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* 6. Cross-links (also building) */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Also building
          </p>
          <h2 className="text-heading-32 tracking-tight">
            Other use cases.
          </h2>
        </header>
        <div className="flex flex-wrap gap-2">
          {Object.entries(USE_CASES)
            .filter(([s]) => s !== slug)
            .map(([s, m]) => (
              <Link
                key={s}
                href={`/use-cases/${s}`}
                className="rounded-md border border-border px-4 py-2 text-label-14 text-foreground transition-colors hover:bg-accent/30"
              >
                {m.title}
              </Link>
            ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* 7. Final CTA */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-heading-40 tracking-tight">
          Ready to ship this?
        </h2>
        <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          {meta.starterSlug
            ? `Bootstrap a working ${meta.title.toLowerCase()} project with a single CLI command.`
            : `Pick a template that matches this use case and start in under a minute.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {meta.starterSlug ? (
            <Link
              href={`/templates/${meta.starterSlug}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-button-16 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start with a template
            </Link>
          ) : (
            <Link
              href="/templates"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-button-16 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start with a template
            </Link>
          )}
          <Link
            href="/manifesto"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-button-16 font-medium text-foreground transition-colors hover:bg-accent/30"
          >
            Read the manifesto
          </Link>
        </div>
      </section>
    </div>
  )
}
