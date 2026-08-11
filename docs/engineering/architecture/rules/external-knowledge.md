# External knowledge policy

## Question this doc answers

*When implementing or modifying an external library/framework, what
do I read and trust?*

## Policy

**The official documentation is the source of truth for any external
technology. Model knowledge is a hypothesis until verified.**

Steps when an implementation depends on an external library, framework,
SDK, or API:

1. **Identify the exact version installed.** Use `pnpm why <pkg>` or
   read `package.json`. The version in `node_modules/` is what runs,
   not the version the model was trained on.
2. **Locate the official documentation** for that version. Vendor docs
   if available. Cross-check against at most one secondary source
   (a maintained community guide) and only to confirm understanding.
3. **Verify the API or pattern against the documentation.** If the
   documentation describes a different shape than the model suggested,
   the documentation wins. Always.
4. **Prefer documented public APIs over inferred or internal APIs.**
   If a feature is undocumented, it's not a feature — it's a leak.
5. **If the documentation contradicts existing project code, stop and
   report.** Do not silently choose one. The contradiction is itself
   a finding that the review surfaces.

## What "model knowledge" includes

- Patterns the model has seen in training data.
- Stack Overflow snippets, blog posts, tutorials.
- Older API shapes from previous major versions.
- Best practices that may have been updated since the model's training
  cutoff.

All of this is **hypothesis**, not source of truth.

## Examples in this repo

- **oRPC**: the `@orpc/client` `RPCLink.fetch` hook has a 5-argument
  signature `(request, init, options, path, input) => Promise<Response>`.
  The model often forgets the trailing three arguments and types the
  hook as `(request, init) => Response`. We confirmed the signature
  by reading `node_modules/@orpc/client/dist/adapters/fetch/index.d.ts`,
  not by guessing.
- **Next.js ISR**: `init.next.revalidate` and `init.next.tags` are
  read by the standard `fetch` extension in App Router. They are
  not part of the oRPC client context. We confirmed by reading the
  Next.js App Router docs, not by inferring from the oRPC `context`
  pattern.
- **Hono body-parser proxy**: the oRPC Hono adapter requires a `Proxy`
  on `c.req.raw` to forward body-parser methods to Hono's parsed
  getters. The pattern is in the oRPC docs; we copied it as-is rather
  than re-deriving it.

## What to do when the docs and the model disagree

1. **Trust the docs.**
2. **Open an issue in the model-feedback channel** if the model
   repeatedly hallucinates the wrong API. This is signal that the
   training data is stale.
3. **Cite the docs in the PR description.** "Per the docs at
   `<url>`, this procedure must …" makes the reviewer's job easier.

## Anti-patterns

- "I've used this API before, I know how it works." Then the version
  changed and the call signature moved.
- Copy-pasting from a tutorial that targets a different framework
  version.
- Implementing an undocumented behavior because the model "remembers"
  it. The code may work today, break tomorrow when the library
  updates.
- Ignoring the `package.json` version when reading docs. The "latest"
  docs may describe unreleased APIs.

## When this rule applies

**Always.** Every PR that touches a third-party library should
demonstrate that the author consulted the docs. If you can't cite the
URL, you may be guessing.

## Where this rule came from

The PR #45 migration of `/templates` from REST to oRPC stalled
multiple times because the model produced code based on outdated
patterns from training data rather than the current `@orpc/client`
1.14.7 API. The policy exists to prevent recurrence.
