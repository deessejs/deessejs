/**
 * Allowlist of the template images that are actually deployed.
 *
 * The stored form is the bare filename. The public V1 contract exposes
 * it as an absolute path, so the projection prefixes a slash; keeping
 * the two apart is what lets a writer validate a submitted name against
 * this list without ever accepting a path.
 *
 * These are the template PNGs at the root of `apps/web/public`. Adding a
 * new local asset needs a deployment, so the list is the set of names
 * that are known to exist. `og-icon.png` is not a template image and is
 * not in it.
 *
 * Pure data module. No runtime imports beyond types. Importing this
 * file from a client component MUST NOT transitively drag
 * `@workspace/auth` → `@workspace/database` → `postgres` into the
 * browser bundle (Turbopack rejects node builtins). Verified safe: the
 * module imports nothing.
 *
 * `packages/api/tests/unit/category-maps.test.ts` pins every name here
 * against the files deployed in `apps/web/public`, and pins every image
 * the registry declares against this list.
 */
export const TEMPLATE_IMAGE_FILENAMES = [
  "ship-blog-posts.png",
  "ship-your-agents.png",
  "ship-your-docs.png",
  "ship-your-electron-app.png",
  "ship-your-landing.png",
  "ship-your-saas.png",
  "ship-your-sdk.png",
] as const
