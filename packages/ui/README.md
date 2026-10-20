# `@workspace/ui`

The design system of DeesseJS: the primitives, the tokens and the shared stylesheet that every application renders with.

## What's included

- **The shadcn primitives**: one file per component, in `src/components/`
- **The tokens**: colors, typography, spacing, radius, shadows and easing, in `src/styles/globals.css`
- **`cn`**: the class name merger
- **`use-mobile`**: the viewport hook
- **The shared PostCSS configuration**

The rules that govern them live in [DESIGN.md](../../DESIGN.md) at the root of the repository.

## Usage

Import a primitive:

```tsx
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
```

Import the stylesheet once, in the root layout:

```ts
import "@workspace/ui/globals.css"
```

## Exports

| Export | Import path | Contents |
|---|---|---|
| `./globals.css` | `@workspace/ui/globals.css` | The tokens and the Tailwind theme |
| `./postcss.config` | `@workspace/ui/postcss.config` | The shared PostCSS configuration |
| `./lib/utils` | `@workspace/ui/lib/utils` | `cn` |
| `./components/*` | `@workspace/ui/components/*` | The primitives |
| `./hooks/*` | `@workspace/ui/hooks/*` | The hooks |

## How the applications consume it

There is no build step. The applications resolve this package as source, through a `paths` alias in their `tsconfig.json` and a `transpilePackages` entry in their Next.js configuration.

## Conventions

- **Semantic tokens only.** A component references `--primary`, `bg-primary`, `text-foreground`. It never hardcodes a color.
- **Colors are `oklch()`.** The lightness value `L` approximates the perceived lightness and is the first lever to tune. It is not the contrast: WCAG computes the ratio from the relative luminance, which comes from the RGB components, so the chroma and the hue do contribute. Verify the pairs you ship with a contrast checker.
- **The dark theme redefines the same token names.** A component never changes between themes, only the values behind the tokens do.
- **The radius scale is Geist's three tiers,** `sm`, the default and `lg`.
- **The focus ring is the signature of this system:** a 2px gap in the surface color, then a 2px ring.
- **Motion is functional.** The default duration for a state change is 0ms, and `prefers-reduced-motion` is respected.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm format
```

There is no test script: the primitives are exercised through the applications that render them.

## Notes

- To add a primitive, follow the contract in `DESIGN.md` and update its inventory there. To remove one, delete the file, remove its imports, and keep the typecheck and the build green.
- The tokens are the runtime source of truth. `DESIGN.md` is the specification they implement.

## Related

- **Uses**: [`@workspace/env`](../env/README.md)
- **Used by**: [`@workspace/cookies`](../cookies/README.md), [`apps/app`](../../apps/app/README.md), [`apps/docs`](../../apps/docs/README.md), [`apps/web`](../../apps/web/README.md)

The conventions of this package are in [AGENTS.md](AGENTS.md).
