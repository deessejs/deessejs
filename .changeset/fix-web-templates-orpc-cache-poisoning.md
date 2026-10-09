---
"web": patch
---

Replaces the previous (incorrect) diagnostic with the actual root cause and the static-render fix.

The earlier patch assumed the catalog-empty incident (issue #81) was a Next.js data-cache key collision. That diagnosis was wrong. Two interacting transport bugs caused the empty catalog to surface on the public site, and they survive the cache-key fix:

- `packages/api/src/http/mount-rpc.ts` spread an upstream `Response` into `Hono.Context.newResponse(body, { ...response, headers })`. `status` and `statusText` are non-enumerable on the Response prototype chain, so the spread silently dropped them. Hono fell back to its default 200, an `ORPCError` translated to a 502 envelope arrived as HTTP 200, and oRPC's `StandardRPCLinkCodec.decode` interpreted it as success.
- `packages/api/src/orpc/routes/templates.ts` invoked `logger.error("templates_fetch_failed", { requestId, message })`. The `logger.error` signature is `error(msg, err, ctx)`, so the second argument was rendered as `[object Object]` and the request-id correlation was lost.

Additionally, the previous changeset documented that "tags are separate cache keys" and that a `try/catch` returning `[]` in the page would poison the Data Cache. That is incorrect: tags are an invalidation mechanism. The Next.js v16 fetch cache key includes URL, method, headers, body, and other fetch options, never tags. The actual cache concern is the well-known rule that v16 fetch only persists responses with a 200 status — exactly what the spread bug broke. A separate defect in `CATEGORY_LABELS` (only `saas`, `ai`, `landing`) silently excluded entries whose `category` was `desktop`, `docs`, `marketing`, `content`, `library`, or `ai-agent`.

This changeset delivers the actual fix:

- `mountRpc` passes `status: response.status` explicitly into `c.newResponse`, preserving upstream 4xx/5xx codes end-to-end. A unit test pins the behaviour with a custom Hono app and asserts the regression path (the spread) collapses the status.
- The templates procedure uses the `logger.error(msg, err, ctx)` shape so logs carry the actual error and the request id.
- The procedure enforces `.output(TemplatesListResponseV1)` so a malformed upstream payload cannot leak as `{ templates: undefined }` — the previous defensive coercion in the web client (`?? []`) is no longer load-bearing.
- `CATEGORY_LABELS` mirrors the registry taxonomy (`saas`, `desktop`, `docs`, `marketing`, `content`, `library`, `ai-agent`).
- `packages/api/src/templates.ts` is now exported as `@workspace/api/templates-catalog`. The `apps/web` index page and detail page read the registry directly — no oRPC call, no GitHub fetch, no `liveCache`. The page is now statically rendered.
- Detail pages use `dynamicParams = false` and read the slug list from the registry via `generateStaticParams`. A missing slug returns a real 404, not a "Template not found" title served as 200.
- `apps/web/src/components/templates/templates-browser.tsx` is the new client-side filter UI: type/framework/search filter against the static catalog without a server round-trip, retaining shareable `?type=` and `?framework=` URLs.
- The sitemap now includes every detail URL derived from the registry.
- The regression test `apps/web/tests/e2e/templates-cache.spec.ts` no longer asserts `x-nextjs-cache: HIT` is forbidden — under the static render a HIT is the EXPECTED outcome. The new assertion pins that a `MISS` is a regression to the dynamic path, and a separate test renders the page with the API blocked, confirming the catalog survives without an upstream call.
- A new contract suite `packages/api/tests/contract/templates-catalog.test.ts` pins registry invariants (slug uniqueness, category coverage, declared-label consistency).
- A new unit suite `packages/api/tests/unit/mount-rpc-status.test.ts` pins the Hono status preservation contract.

The previous changeset is superseded.

Follow-up — sidebar/grid unification, versioned READMEs, hardened tests

Review of the static-build commit surfaced four load-bearing items
that needed closure before the work is ready for review:

- Sidebar filters did not share URL state with the grid. The
  index passed `activeTypes={[]}` to the `CategorySidebar`, the
  filter UI never reflected active selection, and toggles had no
  client-side path. The whole surface — sidebar + search + grid —
  is now one client component (`TemplatesBrowser`) reading and
  writing the same `useSearchParams`. Selecting a type or
  framework entry updates the URL via `router.replace`, the grid
  reflects the change immediately, and back/forward restores
  prior filter state. The `CategorySidebar` server component is
  no longer imported from the page; the new component owns the
  surface end-to-end.

- README content was missing from the detail pages. The
  previous commit removed the runtime GitHub fetch, which also
  removed the README entirely. `/templates/[slug]` is now read
  from versioned snapshots at
  `packages/api/src/templates/readmes/{slug}.md`. A `prebuild`
  step inlines them into a TS module
  (`readmes.generated.ts`) so consumers never need a runtime
  filesystem read. A refresh script at
  `scripts/refresh-template-readmes.ts` pulls the canonical
  README from each GitHub repo on demand; the build never hits
  GitHub. The build-artifact test asserts every detail page
  embeds its README H1.

- The mount-rpc-status test re-implemented a parallel
  middleware; that left it blind to regressions inside the real
  `mountRpc`. The suite now drives the production `api` Hono
  object against the e2e-guard failure path and asserts the
  status preservation contract end-to-end. The build-artifact
  test reads `prerender-manifest.json` and verifies every
  catalog slug ships an HTML payload containing its README
  heading. These tests run against the actual build artifacts,
  not just the runtime behaviour.

- The P0 e2e suite now covers the index → detail → back → reload
  path with the API network blocked, and the P1 suite adds
  multi-select, deselection, and back/forward coverage.

The CLI publish-verify, vale-docs, and Vercel deessejs-agent
checks were failing on `staging` (commit `cb2a2c5`) before this
work; they remain failing on `staging` and the same is true on
this PR. They are infrastructure issues unrelated to the
catalog work.
