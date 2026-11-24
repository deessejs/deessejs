# `@deessejs/ui`

This workspace owns the public, theme-compatible React primitives package. It is independent of the DeesseJS product applications and private workspace packages.

## Boundaries

- Keep the npm package name `@deessejs/ui` and package its compiled files from `dist/`.
- React and React DOM are peer dependencies. Do not add product runtime, server, app, admin, or private `@workspace/*` dependencies.
- The host application owns semantic theme values, global CSS, and light/dark mode. Components consume the host's shadcn CSS-variable theme.
- `tailwind.css` only registers the package's published `dist/` sources with Tailwind v4. It must not import Tailwind or define global theme values or reset styles.
- Interactive primitives use Base UI as selected by the public UI RFC. Keep Radix contexts and APIs out of this package.

## Commands

```sh
pnpm --filter @deessejs/ui typecheck
pnpm --filter @deessejs/ui build
pnpm --filter @deessejs/ui lint
```

The independent consumer example is in `examples/ui-consumer/`.
