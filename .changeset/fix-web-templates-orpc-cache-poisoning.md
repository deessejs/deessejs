---
"web": patch
---

Fixes issue #81: the `/templates` index page rendered the empty-state for up to ten minutes after a single transient failure of `orpc.templates.list()`. Two interacting anti-patterns caused it:

- `apps/web/src/lib/orpc.ts` hard-coded `next: { revalidate: 600, tags: ["templates"] }` on every oRPC call, so every RSC call-site shared a single Next.js data-cache key.
- The four call-sites for `orpc.templates.list()` (`templates/page.tsx` index, `templates/[template_slug]/page.tsx` `generateStaticParams` / `generateMetadata` / detail page) swallowed errors as `[]`. The first thrown error cached `{ templates: [] }` for ten minutes.

What's in this patch:

- The `RPCLink` fetch wrapper now reads per-call `options.context.cache` and threads a namespaced tag (`templates:live` vs `templates:static`) and revalidate window onto the request. Without context the wrapper falls back to the previous site-wide behavior (`revalidate: 600`, tag `"templates"`) so any future call-site that forgets to set context does not silently change semantics.
- Two ergonomic helpers are exported from `apps/web/src/lib/orpc.ts`: `liveCache` (`revalidate: 0`, tag `templates:live`) for live runtime + on-demand metadata, and `staticParamsCache` (`revalidate: 600`, tag `templates:static`) for `generateStaticParams`. They wrap the underlying `context.cache` shape so call-sites stay readable.
- Live runtime call-sites now re-throw on fetch error so the segment's existing `error.tsx` client boundary renders the "Try again" state instead of silently caching an empty body. The detail-page catch deliberately does NOT call `notFound()` — a fetch error is not a 404.
- During `next build` (`NEXT_PHASE === "phase-production-build"`) the runtime call-sites fall back to their previous graceful-degradation behavior so the build still ships when the API is unreachable. Production runtime always re-throws.
- `generateStaticParams` keeps its `try/catch → []` so a flaky API does not break CI.
- The misleading "build-time-only" comment in `templates/page.tsx` and the misleading "render a minimal placeholder" comment in the detail page are replaced with accurate descriptions.
- The previously tautological per-call context type (`MarketingCallContext`) is renamed to `FetchCacheOptions` to avoid conflation with the server-side `BaseContext` (`packages/api/src/orpc/base-context.ts`). They are separate types with separate lifecycles; the rename makes the distinction self-documenting at call-sites.
- The translation logic is extracted into a pure function `buildFetchIsrInit(init, cacheDirective)` colocated with the wrapper. A new vitest suite (`apps/web/src/lib/orpc.test.ts`) pins the translation contract — defaults, `liveCache`, `staticParamsCache`, partial directives, non-mutation of the input `init`, and pass-through of `headers` / `method` / `body`. The whole marketing site has unit-test infrastructure added (`vitest.config.ts`, `@workspace/vitest-config` devDep, `test` script) so future helpers can be tested the same way.

No public consumer-facing API change. `/templates` and `/templates/[slug]` continue to render the same way they did before, except a transient upstream failure now resolves through the error boundary instead of pinning the empty-state.
