import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

/**
 * Editorial column (eyebrow + heading + body + command + CTA) that
 * pairs with the shared `<CliWorkbenchDemo>`. Pure presentational;
 * no workbench, no responsive split — the caller decides where the
 * column sits in its own layout (typically the right cell of a
 * 2-col grid next to the workbench).
 *
 * Each caller writes its own copy. The homepage and `/cli` ship
 * different eyebrows, headings, and CTAs without sharing strings.
 */
export function CliInActionEditorial({
  eyebrow,
  heading,
  body,
  afterBody,
  command,
  cta,
}: {
  eyebrow: string
  heading: string
  body: string
  /** Optional second body paragraph rendered below the primary one. */
  afterBody?: string
  command: string
  cta: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col gap-4 p-6 lg:p-10">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
        {heading}
      </h2>
      <p className="text-copy-14 leading-6 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
        {body}
      </p>
      {afterBody ? (
        <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
          {afterBody}
        </p>
      ) : null}
      <p className="text-copy-14 text-muted-foreground mt-2">
        Run{}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-copy-13 text-foreground/90">
          $ {command}
        </code>
        {}from your terminal.
      </p>
      <Link
        href={cta.href}
        className="inline-flex w-fit items-center gap-1 self-start text-label-13 text-foreground hover:underline underline-offset-4"
      >
        {cta.label}
        <ArrowUpRight aria-hidden className="size-3" />
      </Link>
    </div>
  )
}
