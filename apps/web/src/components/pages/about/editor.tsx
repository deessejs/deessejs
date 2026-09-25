/**
 * /about — "Edited by Nesalia Inc." prose section.
 *
 * Same recipe as MainApp: 2-col on lg+ with title in the
 * left cell, paragraph block in the right cell. Section owns
 * its `border-b border-border` and `py-16 px-4 md:px-6
 * md:py-20 lg:py-24` padding — this matches
 * `enterprise/process-timeline.tsx:25` and the rest of the
 * marketing app's section rhythm.
 */
export function Editor() {
  return (
    <section className="grid grid-cols-1 gap-8 border-b border-border py-16 px-4 md:px-6 md:py-20 lg:py-24 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <h2 className="text-heading-24 tracking-tight text-foreground lg:pt-1">
        Edited by Nesalia Inc.
      </h2>
      <div className="space-y-4">
        <p className="max-w-3xl text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          DeesseJS is published by Nesalia Inc., a small company
          that funds the work and owns the brand. The
          templates, contracts, CLI, and sub-domain apps are MIT.
          The brand, the curated registry, and the marketplace
          positioning stay ours.
        </p>
        <p className="max-w-3xl text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          That split is intentional. The source-code ecosystem is
          shared. Anyone can fork, ship, and contribute back. The
          product surface is owned: a single team gets to
          curate the registry, set the defaults, and steward what
          ships under the DeesseJS name.
        </p>
      </div>
    </section>
  )
}
