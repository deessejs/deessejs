/**
 * Decorative horizontal band that mirrors the diagonal-stripe motif
 * of the left/right columns in `GlobalLayout`
 * (`apps/web/src/components/layouts/global-layout.tsx:39-48`),
 * transposed vertically.
 *
 * Used between two visually similar sections on the homepage
 * (ForWho → CliInAction) where a plain 1px `border-b` reads as too
 * discreet to signal a change of register. The strip takes the same
 * color token (`var(--border)`), the same gradient tile
 * (`bg-size-[10px_10px]`), the same 315deg→45deg family of diagonal
 * stripes, the same `aria-hidden` + `pointer-events-none` contract,
 * and the same `xl:block` breakpoint as the side columns — so all
 * three appear and disappear together on the marketing route.
 *
 * Not a content section: render only between sections, never on its
 * own. The `border-y` frames the strip top and bottom and
 * visually replaces the `border-b` of the section above plus the
 * implicit `border-t` of the section below, so the two adjacent
 * sections read as cleanly separated.
 */
export function DiagonalStripDivider() {
  return (
    <div
      aria-hidden
      className="pointer-events-none hidden h-8 border-y border-border bg-[repeating-linear-gradient(45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] xl:block"
    />
  )
}
