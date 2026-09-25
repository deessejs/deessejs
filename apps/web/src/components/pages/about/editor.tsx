/**
 * /about — "Edited by Nesalia Inc." prose section.
 *
 * Two paragraphs describing the open-source / owned-product
 * split: the templates, contracts, CLI, and sub-domain apps
 * are MIT; the brand, curated registry, and marketplace
 * positioning stay ours.
 */
export function Editor() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        Edited by Nesalia Inc.
      </h2>
      <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
        DeesseJS is published by Nesalia Inc., a small company
        that funds the work and owns the brand. The
        templates, contracts, CLI, and sub-domain apps are MIT.
        The brand, the curated registry, and the marketplace
        positioning stay ours.
      </p>
      <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        That split is intentional. The source-code ecosystem is
        shared. Anyone can fork, ship, and contribute back. The
        product surface is owned: a single team gets to
        curate the registry, set the defaults, and steward what
        ships under the DeesseJS name.
      </p>
    </section>
  )
}
