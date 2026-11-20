import type { DeesseRequestContext } from "deesse"
import type { postsSchema } from "../../deesse.config.js"

export type PostsSchema = typeof postsSchema
export type ExampleRequestContext = DeesseRequestContext<
  PostsSchema,
  { transactions: true },
  { id: string; name: string; email: string },
  object
>
