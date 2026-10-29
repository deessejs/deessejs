# `@workspace/storage`

## Scope

This package owns server-side object storage adapters and generic object operations. It must remain agnostic to the domain using it. Do not add profile image, template artifact, entitlement, authentication, database or registry rules here.

Applications must not import provider runtime code directly. Backend composition creates storage instances with server-only credentials and exposes the appropriate behavior through a defined API or client contract.

## Conventions

- Keep provider configuration explicit and scoped to one bucket per instance.
- Keep credentials out of client exports and never return credentials from the package.
- Preserve provider errors for the composition layer to map to its own contract.
- Use ESM `.js` extensions for relative imports and `import type` for type-only imports.
- Add shared dependency versions to the root `pnpm-workspace.yaml` catalog.
- Do not add domain-specific defaults, key layouts or authorization decisions.

## Verification

Run the package build, typecheck and lint when changing this workspace. Run tests when the package has a test suite and the task calls for verification.
