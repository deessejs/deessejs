---
name: feedback-pixel-blast-positioning
description: PixelBlast WebGL background — color must match bg brightness, positioning must be inline style not className merge
metadata:
  type: feedback
---

For the `PixelBlast` WebGL background effect (apps/web/src/components/homepage/pixel-blast.tsx):

**Color choice depends on page mode:**
- White pixels (`color="#ffffff"`) are invisible on light bg (`bg-background` in light mode = white). Visible on dark bg.
- Black pixels (`color="#000000"`) are invisible on dark bg. Visible on light bg.
- For both modes: use a mid-tone (e.g. `#808080`) for cross-mode legibility, OR switch the color based on `dark:` variant / CSS variable.
- User's site appears to be in dark mode (bg = black) — the white pixels on black are the intended look. Don't second-guess and switch to black.

**Positioning must be inline `style`, NOT a wrapper div:**
- The component's default outer className is `h-full w-full relative overflow-hidden`.
- A wrapper `<div className="absolute inset-0"><PixelBlast ... /></div>` does NOT work reliably: `h-full` on the PixelBlast outer div doesn't resolve when its parent is absolute-positioned with implicit dimensions (only `top:0; bottom:0` set, no explicit height). Browser-specific quirks — sometimes renders at 0×0.
- Correct usage: pass the position sizing directly to PixelBlast via `style` prop, which overrides the default `relative` className cleanly:
  ```tsx
  <PixelBlast
    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    ...
  />
  ```
- Don't try `className="!absolute !inset-0"` — the `!important` works but inline style is more readable and avoids any className cascade uncertainty.

**Section must be `relative`:** the PixelBlast's containing block is the nearest `position: relative` ancestor. The hero `<section>` already has `relative`, so no change needed there. If using in another context, make sure the parent section has `position: relative`.

**Z-index:**
- PixelBlast at default z-index (0)
- Content needs `relative z-10` to sit above the canvas
- Ripples only fire in canvas areas not covered by z-10 content — fine for centered hero content