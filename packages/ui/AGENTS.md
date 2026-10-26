# packages/ui

You own the design system: the primitives, the tokens and the shared stylesheet that every application renders with. A change here is visible on every page of the product.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace, and [DESIGN.md](../../DESIGN.md) is the specification this package implements. Read them when your change touches a token, a primitive or a cross-workspace rule, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/styles/globals.css` | The tokens: colors, typography, spacing, radius, shadows, easing, and the Tailwind theme mapping. |
| `src/components/` | The shadcn primitives, one file per component. |
| `src/lib/utils.ts` | `cn`, the class name merger. |
| `src/lib/sidebar.ts` | The name of the cookie the sidebar's open state is written in. |
| `src/hooks/use-mobile.ts` | The viewport hook. |
| `postcss.config.mjs` | The shared PostCSS configuration. |

## How the applications consume it

There is no build step. The applications resolve this package as source, through a `paths` alias in their `tsconfig.json` and a `transpilePackages` entry in their Next.js configuration. The exports map points at the source files:

| Export | Resolves to |
|---|---|
| `./globals.css` | `src/styles/globals.css` |
| `./postcss.config` | `postcss.config.mjs` |
| `./lib/utils` | `src/lib/utils.ts` |
| `./lib/sidebar` | `src/lib/sidebar.ts` |
| `./components/*` | `src/components/*.tsx` |
| `./hooks/*` | `src/hooks/*.ts` |

## Conventions

- **Semantic tokens only.** A component references `--primary`, `bg-primary`, `text-foreground`. It never hardcodes a color, and it never reaches for a raw hex value. The token table lives in `DESIGN.md`.
- **Colors are `oklch()`.** The lightness value `L` approximates the perceived lightness, and it is the first thing to tune. It is not the contrast: WCAG computes the ratio from the relative luminance, which comes from the RGB components, so the chroma and the hue do contribute. Verify the pairs you actually ship with a contrast checker, and never infer conformance from `L` alone.
- **The dark theme redefines the same token names.** A component never changes between themes, only the values behind the tokens do.
- **The radius scale is Geist's three tiers,** `sm`, the default and `lg`. The shadcn `radius-2xl` family is not used.
- **The focus ring is the signature of this system.** A 2px gap in the surface color, then a 2px ring: `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)`. Copy it exactly.
- **Every primitive ships its states.** Default, hover, focus, active, disabled, and the empty, loading and error states of anything asynchronous.
- **Motion is functional.** The default duration for a state change is 0ms. Animation that only decorates does not ship, and `prefers-reduced-motion` is respected.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm format
```

There is no test script in this workspace. The primitives are exercised through the applications that render them.

## Adding a primitive

1. Add the component under `src/components/`, following the patterns in `DESIGN.md`.
2. Reference the semantic tokens, never raw values.
3. Check the light and the dark theme.
4. Update the inventory section of `DESIGN.md`.

## Removing a primitive

The modular contract applies: delete the file, remove its imports, and keep `pnpm typecheck` and `pnpm build` green. Then update the inventory in `DESIGN.md`. A buyer has to be able to do the same.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/cookies](../cookies/AGENTS.md)
- [apps/web](../../apps/web/AGENTS.md)
- [apps/app](../../apps/app/AGENTS.md)
