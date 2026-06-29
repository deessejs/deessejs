---
name: project-pixel-blast-hero
description: three.js + postprocessing on the marketing hero — perf traps, mobile fallback, CLS, and how to extend without breaking LCP
metadata:
  type: project
---

The marketing home hero renders `<PixelBlast variant="square" ... />` as a WebGL background using `three` 0.184 + `postprocessing` 6.39. It runs on every page load of `/` — performance here directly affects LCP and conversion.

## Current configuration

```tsx
<PixelBlast
  variant="square"
  pixelSize={4}
  color="#ffffff"
  patternScale={2}
  patternDensity={1}
  pixelSizeJitter={0}
  enableRipples
  rippleSpeed={0.4}
  rippleThickness={0.12}
  rippleIntensityScale={1.5}
  liquid={false}
  speed={0.5}
  edgeFade={0.25}
  transparent
  style={{ position: "absolute", opacity: 0.1 }}
/>
```

## Gotchas

1. **WebGL context exhaustion** — if the component is mounted twice (e.g. dev-mode React.StrictMode double-invoke), you can hit "Too many active WebGL contexts" on Chrome. PixelBlast must clean up its renderer + scene + animation frame on unmount.

2. **Mobile fallback** — three.js + postprocessing on a low-end Android can drop the page from 60fps to 15fps and tank LCP. Detect via `navigator.hardwareConcurrency < 4` or `window.matchMedia('(max-width: 768px)')` and either skip the effect or render a static gradient fallback.

3. **CLS from canvas resize** — if the canvas size changes after first paint (e.g. font load triggers layout shift), the canvas re-sizes and the hero shifts. Lock dimensions with `aspect-ratio` or fixed `min-height` on the parent.

4. **GPU cost of `enableRipples` + `patternDensity > 1`** — the ripple effect re-renders every frame for each ripple. At density 1 + ripples, you're at the edge of what's acceptable on M1/M2 Macs. On Intel Macs it stutters. Keep `patternDensity: 1` and test on Intel before raising.

5. **`transparent` + low opacity** — the visual effect is intentionally faint (`opacity: 0.1`). If you bump it, you'll drown the headline. Don't.

6. **postprocessing bundle** — `postprocessing` ships its own shader chunks. Don't add more postprocessing imports unless you tree-shake audit.

## How to extend safely

- Add props to PixelBlast only if they have a `transparent` and `speed`-bounded default
- Always test on `localhost` over LAN (mobile) — `pnpm --filter web dev` then open on phone
- Always profile with DevTools → Performance → "Screenshots" before/after change
- If proposing a 3D feature elsewhere on the site, port the same cleanup + mobile fallback pattern

**How to apply:** Treat the hero as a perf-critical surface, not decoration. Every visual change should ship with a Lighthouse before/after.

Related: [[project-apps-web-scope-and-boundaries]] (PixelBlast is in LIVE marketing scope, owned by this agent)