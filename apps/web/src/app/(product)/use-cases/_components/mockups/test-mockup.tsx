/**
 * TestMockup — generic test placeholder for the use-case detail
 * pages. Mirrors the "peek" pattern used by `EcosystemTabs` and
 * `SurfacesTabs` on the homepage: a mockup anchored to one corner
 * of its container and translated 25% past the corner so only ~75%
 * is visible, suggesting "more here" without committing to a final
 * illustration.
 *
 * By default the peek sits in the bottom-right corner (matching
 * the homepage convention). Pass `reverse` to flip the anchor so
 * the peek sits in the bottom-left corner — useful when the
 * surrounding `<SimulatedSection>` flips the column order
 * (text on the right, mockup on the left).
 *
 * Internally shows a fake macOS-style window header (three colored
 * dots) and a dotted grid placeholder for the body. The grid reuses
 * the same `bg-[radial-gradient(...)]` recipe used by the homepage
 * `Hero` and `LatestGuides` placeholders so the visual texture is
 * consistent across the site.
 *
 * This is intentionally a *test* asset: replace with a real
 * per-section mockup when editorial has the final design. Until
 * then it is visually consistent and accessibility-correct
 * (aria-hidden on the wrapper because it is decorative).
 */
export function TestMockup({ reverse = false }: { reverse?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        // Bottom-right by default (matches homepage pattern). When
        // reverse is set, anchor to bottom-left and translate the
        // other way so the visible portion sits in the corner the
        // reader is looking at.
        reverse
          ? "absolute bottom-0 left-0 h-[110%] w-[110%] -translate-x-[25%] translate-y-[25%] bg-muted/40 border border-border overflow-hidden"
          : "absolute bottom-0 right-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%] bg-muted/40 border border-border overflow-hidden"
      }
    >
      <div className="flex items-center justify-start gap-2 border-b border-border bg-background/40 px-4 py-3">
        <span className="block size-3 rounded-full bg-[#ff5f57]" />
        <span className="block size-3 rounded-full bg-[#febc2e]" />
        <span className="block size-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
    </div>
  )
}
