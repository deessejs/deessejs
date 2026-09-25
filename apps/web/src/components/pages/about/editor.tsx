/**
 * /about — "Edited by Nesalia Inc." prose section.
 *
 * Two paragraphs describing the open-source / owned-product
 * split: the templates, contracts, CLI, and sub-domain apps
 * are MIT; the brand, curated registry, and marketplace
 * positioning stay ours.
 *
 * Same recipe as MainApp: `space-y-4` between heading and
 * each paragraph, `max-w-3xl` on every body paragraph for
 * senior prose readability (~75ch).
 */
export function Editor() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Edited by Nesalia Inc.
      </h2>
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
    </section>
  )
}
