# knowledge-base/

Empty for now. Reserved for future deep-dives on specific topics that
the architecture/overview, decisions/, and rules/ don't cover.

Examples of what might live here:

- A study of an external library we depend on (oRPC, Better Auth,
  Drizzle) covering the version we pin and the failure modes we
  should plan for.
- A retrospective on a specific incident and the architectural
  change it triggered.
- A comparison of two approaches we considered and the trade-offs we
  weighed.
- A walkthrough of a non-obvious code path that future readers will
  need to understand.

Each entry in this folder must:
- Be at least as deep as the doc it replaces (no surface-level
  restatements of code).
- Cite the upstream docs or commits it builds on.
- Stand on its own: a reader who doesn't know the history should be
  able to read this doc without reading three other docs first.

Until there is content to put here, this README is the only file.
