/**
 * Ecosystem code snippets — server-only module.
 *
 * Four hardcoded TypeScript samples, one per ecosystem tool. The
 * snippets demonstrate the planned `@deessejs/errors` / `@deessejs/fp`
 * / `@deessejs/drpc` / `@deessejs/collections` API surface and are
 * rendered through Shiki inside `<EcosystemCodeMockup>` on the
 * homepage Ecosystem section.
 *
 * Server-only because the consumer (`ecosystem-code-mockup.tsx`) is a
 * Server Component and calls `shiki` server-side. Keeping the strings
 * in a sibling `.ts` file means this module never ships in the
 * client's JS bundle, and the snippets are easy to edit without
 * touching the layout components.
 *
 * Snippets are illustrative — the actual API surface may differ
 * once each package ships. Trim/adjust each sample as the public API
 * stabilises.
 */

export type EcosystemSlug = "errors" | "fp" | "drpc" | "collections"

export type EcosystemSnippet = {
  /** Filename shown in the mockup's macOS-style header bar. */
  tabName: string
  /** Shiki language id. */
  lang: "typescript"
  /** TypeScript source, ≤15 lines. */
  code: string
}

export const ECOSYSTEM_SNIPPETS: Record<EcosystemSlug, EcosystemSnippet> = {
  errors: {
    tabName: "errors.ts",
    lang: "typescript",
    code: `import { Errors, Schema } from "@deessejs/errors"

class UserNotFound extends Errors.TaggedError("UserNotFound")({
  userId: Schema.String,
}) {}

const findUser = (id: string) => {
  const user = db.user.find(id)
  if (!user) throw new UserNotFound({ userId: id })
  return user
}

export const route = Errors.handle(findUser, {
  UserNotFound: ({ userId }) => ({ status: 404, body: { userId } }),
})`,
  },
  fp: {
    tabName: "fp.ts",
    lang: "typescript",
    code: `import { pipe, Option } from "@deessejs/fp"

const getActiveOrg = (user: User) =>
  pipe(
    Option.fromNullable(user.orgId),
    Option.flatMap((id) => db.org.find(id)),
    Option.filter((org) => org.status === "active"),
  )

const orgName = pipe(
  getActiveOrg(currentUser),
  Option.map((org) => org.name),
  Option.getOrElse(() => "Personal"),
)`,
  },
  drpc: {
    tabName: "drpc.ts",
    lang: "typescript",
    code: `import { createDRPCClient } from "@deessejs/drpc"

const client = createDRPCClient({
  endpoint: "https://drpc.deessejs.com/rpc",
  token: process.env.DRPC_TOKEN,
})

const result = await client.runAgent({
  workflow: "summarize",
  input: { documentId: "doc_123" },
})`,
  },
  collections: {
    tabName: "collections.ts",
    lang: "typescript",
    code: `import { defineCollection, schema } from "@deessejs/collections"

export const Posts = defineCollection({
  name: "posts",
  schema: schema.object({
    id: schema.string,
    title: schema.string,
    publishedAt: schema.date,
    author: schema.relation("users"),
  }),
})

const recent = await Posts
  .where({ publishedAt: { $lt: new Date() } })
  .orderBy({ publishedAt: "desc" })
  .limit(10)`,
  },
}
