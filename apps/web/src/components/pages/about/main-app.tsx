/**
 * /about — "The main app" prose section.
 *
 * Two-column section on lg+ (eyebrow + heading in the left
 * cell, paragraph block in the right cell), per the
 * `enterprise/trust-and-compliance.tsx:28-49` and
 * `enterprise/proof-points.tsx` pattern: section owns its own
 * outer wrapper (`border-b border-border py-16 px-4 md:px-6
 * md:py-20 lg:py-24`), interior split on `lg:grid-cols-2` for
 * the title-vs-content split.
 *
 * Body paragraphs carry `max-w-3xl` for senior prose
 * readability (~75ch at 16px); the title cell sits in the
 * first grid column at `text-heading-24`. The "12rem" label
 * width matches the trust-and-compliance's left-column
 * proportion.
 */
export function MainApp() {
  return (
    <section className="grid grid-cols-1 gap-8 border-b border-border py-16 md:py-20 lg:py-24 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <h2 className="text-heading-24 tracking-tight text-foreground lg:pt-1">
        The main app
      </h2>
      <div className="space-y-4">
        <p className="max-w-3xl text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          The deessejs org runs more than one product. There are the
          templates you can scaffold today, the contracts they all
          share, the SDKs and CLI you install them through, and a
          small set of sub-domain products that ship on the same
          defaults. DeesseJS is the surface that ties them together
          and tells the world what the org is for.
        </p>
        <p className="max-w-3xl text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          When a new template is published, when a contract
          version bumps, when the CLI gains a flag. DeesseJS is
          where it shows up first. The marketing site, the docs
          surface, and the registry all read from the same source
          of truth, so a release on one side reaches every surface
          on the other.
        </p>
      </div>
    </section>
  )
}
