/**
 * Decorative horizontal band between ForWho and CliInAction on the
 * homepage.
 *
 * Seven columns: two flexible flanks + three 208px hatched cells
 * separated by two 96px solid cells. The hatch is a tiny inline
 * SVG (4px diagonal tiles at 15% foreground opacity) shipped as
 * a `data:` URL so the strip needs no external asset. Hidden
 * below `lg` (`max-lg:hidden`).
 */
const HATCH_BG =
  "url(\"data:image/svg+xml,%3Csvg width='7' height='7' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23hsl(var(--foreground))' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E\")"

export function DiagonalStripDivider() {
  return (
    <div aria-hidden className="flex h-6 gap-1 py-2 max-lg:hidden">
      <div className="flex-1 border" />
      <div
        className="h-full w-52 border-2 border-dashed"
        style={{ backgroundImage: HATCH_BG }}
      />
      <div className="w-24 border" />
      <div
        className="h-full w-52 border-2 border-dashed"
        style={{ backgroundImage: HATCH_BG }}
      />
      <div className="w-24 border" />
      <div
        className="h-full w-52 border-2 border-dashed"
        style={{ backgroundImage: HATCH_BG }}
      />
      <div className="flex-1 border" />
    </div>
  )
}
