# Public UI package consumer

This standalone Next.js app demonstrates `@deessejs/ui` as a workspace dependency. It does not depend on the admin package, product apps, or the original `next-shadcn-monorepo` example.

The app owns its theme values and global CSS. Its Tailwind stylesheet imports Tailwind once, then imports the UI package's source-registration entry.

Run from the repository root:

```sh
pnpm --filter @deessejs/ui-consumer dev
pnpm --filter @deessejs/ui-consumer typecheck
pnpm --filter @deessejs/ui-consumer build
pnpm --filter @deessejs/ui-consumer lint
```
