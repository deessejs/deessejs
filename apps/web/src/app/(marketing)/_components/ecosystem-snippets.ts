/**
 * Ecosystem code snippets - server-only module.
 *
 * TypeScript samples for each ecosystem tool, rendered through
 * Shiki inside `<EcosystemCodeMockup>` on the homepage Ecosystem
 * section.
 *
 * Each tool exposes one or more `EcosystemSnippet` files (typed by
 * filename + lang + code). Errors and FP ship with two files
 * (definition + usage example) so the inner mockup shows a small
 * editor-style tab strip. DRPC and Collections are still in
 * development - they keep a single file so the mockup reads as a
 * clean placeholder until those packages ship.
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side. Keeping the strings in a sibling `.ts` file means
 * this module never ships in the client's JS bundle, and the
 * snippets are easy to edit without touching the layout
 * components.
 *
 * Snippets are illustrative - the actual API surface may differ
 * once each package ships. Trim/adjust each sample as the public API
 * stabilises.
 */

export type EcosystemSlug = "errors" | "fp" | "drpc" | "collections"

export type EcosystemSnippet = {
  /** Filename shown in the mockup's inner tab strip. */
  tabName: string
  /** Shiki language id. */
  lang: "typescript"
  /** TypeScript source, <=15 lines. */
  code: string
}

/** A tool bundles one or more file snippets. */
export type EcosystemTool = {
  files: ReadonlyArray<EcosystemSnippet>
}

const errorsFile: EcosystemSnippet = {
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
}

const routeFile: EcosystemSnippet = {
  tabName: "route.ts",
  lang: "typescript",
  code: `import { Errors } from "@deessejs/errors"
import { findUser } from "./errors"

export const GET = Errors.handle(
  async ({ params }: { params: { id: string } }) => {
    const user = await findUser(params.id)
    return { status: 200, body: user }
  },
  {
    UserNotFound: ({ userId }) => ({ status: 404, body: { userId } }),
  },
)`,
}

const fpFile: EcosystemSnippet = {
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
}

const optionFile: EcosystemSnippet = {
  tabName: "option.ts",
  lang: "typescript",
  code: `import { Option } from "@deessejs/fp"

const greet = (name: Option<string>) =>
  Option.match(name, {
    onNone: () => "Hello, stranger",
    onSome: (n) => "Hello, " + n,
  })

const allDefined = Option.all([
  Option.some("a"),
  Option.some(42),
  Option.some(true),
])

const head = Option.fromNullable(input[0])`,
}

const drpcFile: EcosystemSnippet = {
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
}

const collectionsFile: EcosystemSnippet = {
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
}

export const ECOSYSTEM_SNIPPETS: Record<EcosystemSlug, EcosystemTool> = {
  errors: { files: [errorsFile, routeFile] },
  fp: { files: [fpFile, optionFile] },
  drpc: { files: [drpcFile] },
  collections: { files: [collectionsFile] },
}
