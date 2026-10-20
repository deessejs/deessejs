# apps/web

You own the public face of the product: the marketing site, the pricing page, the templates catalogue, the blog, the changelog and the knowledge base. Every page here is read by someone deciding whether to trust the product, so the writing and the rendering matter as much as the code.

Read [the root guide](../../AGENTS.md) first. It holds the invariants that apply everywhere.

## Key files

| Path | Owns |
|---|---|
| `src/app/(marketing)/` | Home, pricing, stack, ecosystem, customers, CLI pages. |
| `src/app/(product)/` | Templates catalogue, blocks and components showcase, use cases. |
| `src/app/(content)/` | Blog, changelog and knowledge base, fed by content collections. |
| `src/app/(legal)/` | Privacy, terms and cookies. |
| `src/app/r/registry.json/route.ts` | The catalogue index, in the shadcn registry shape. |
| `src/app/r/[name].json/route.ts` | One registry item. |
| `src/registry/catalogue.ts` | The catalogue data behind both routes. |
| `content/` | The MDX sources: `posts/`, `knowledge-base/`, `releases/`, `authors/`. |
| `src/components/catalog/` | The shared catalogue components. |

## Conventions

- **Content lives in `content/`, not in the components.** The blog, the changelog, the knowledge base and the authors are MDX files, compiled by content collections. Run `pnpm content-collections` after adding or renaming a content file, otherwise the types do not regenerate.
- **`*-snippets.ts` files hold code samples as strings.** The files under `src/components/` whose name ends in `-snippets.ts` display code on the page. Their imports are text, not dependencies. Do not read them as a dependency graph, and do not try to make them resolve.
- **Components come from `@workspace/ui`.** This app resolves that package through a `paths` alias in `tsconfig.json`, so the source is compiled directly. The same alias covers `@workspace/cookies`, which this app uses without declaring it in `package.json`.
- **The templates catalogue reads from the API.** The registry rows are served by `packages/api` and enriched with live GitHub data. The catalogue here is the component catalogue, which is a different thing: it is the list of UI blocks and components that can be copied into a project.
- **Copy follows the content rules in `DESIGN.md`.** Title case for labels and buttons, sentence case for body text, actions written as verb plus noun, and no exclamation marks.

## Commands

```bash
pnpm dev                    # next dev, port 3000
pnpm build
pnpm test                   # vitest, unit tests in test/unit
pnpm test:e2e               # playwright, tests in tests/e2e
pnpm test:e2e:local         # playwright against a local server
pnpm content-collections    # regenerate the content types
pnpm typecheck
pnpm lint
pnpm format
```

## Tests

`test/unit/` holds the Vitest suites, `tests/e2e/` holds the Playwright specs: navigation, the session-aware header, the templates index, the templates detail page and the templates cache.

## Gotchas

- The templates pages depend on the API. When the API is not running, they render their empty state rather than failing.
- `next.config.ts` allows SVG and local IP addresses in `next/image`. Both are deliberate and both have a comment explaining why. Do not tighten them without reading the comment.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/api](../../packages/api/AGENTS.md)
- [packages/ui](../../packages/ui/AGENTS.md)
- [packages/cookies](../../packages/cookies/AGENTS.md)
