/**
 * /about — "The main app" prose section.
 *
 * Two paragraphs describing what DeesseJS is for the org: the
 * surface that ties templates, contracts, SDKs, CLI, and
 * sub-domain products together. No data, no list — straight
 * prose with foreground + muted-foreground pairing.
 *
 * Rhythm: `space-y-4` (16px) between the heading and each
 * paragraph, matching the prose rhythm established on blog / KB
 * via `MdxRenderer` (which uses `space-y-6`). The 24px the blog
 * index uses would visually over-pace the shorter copy here;
 * 16px is the right beat for paragraphs of this length.
 *
 * `space-y-*` only applies to non-first children, so the
 * `[&:not(:first-child)]:mt-0` override that previously lived
 * on each heading / paragraph is now redundant and removed.
 */
export function MainApp() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        The main app
      </h2>
      <p className="text-copy-16 text-foreground leading-7">
        The deessejs org runs more than one product. There are the
        templates you can scaffold today, the contracts they all
        share, the SDKs and CLI you install them through, and a
        small set of sub-domain products that ship on the same
        defaults. DeesseJS is the surface that ties them together
        and tells the world what the org is for.
      </p>
      <p className="text-copy-16 text-muted-foreground leading-7">
        When a new template is published, when a contract
        version bumps, when the CLI gains a flag. DeesseJS is
        where it shows up first. The marketing site, the docs
        surface, and the registry all read from the same source
        of truth, so a release on one side reaches every surface
        on the other.
      </p>
    </section>
  )
}
