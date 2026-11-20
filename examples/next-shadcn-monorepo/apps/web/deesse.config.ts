import "dotenv/config"
import { os } from "@orpc/server"
import { createDeesse } from "deesse"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { drizzleAdapter } from "@deessejs/drizzle-adapter"
import { postsPlugin } from "./plugins/posts.ts"

const auth = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "local-only-deesse-next-example-secret",
  emailAndPassword: { enabled: true },
} as const

export const deesseConfig = {
  auth,
  api: { router: os.router({ health: os.handler(() => ({ status: "ok" as const })) }) },
  plugins: [postsPlugin()],
} as const

export async function createDeesseApp() {
  const [authSchema, deesseSchema] = await Promise.all([
    import("./.deesse/generated/auth.schema.ts"),
    import("./.deesse/generated/deesse.schema.ts"),
  ])
  const client = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/deesse_next_example", {
    max: 1,
    prepare: false,
  })
  const drizzleDatabase = drizzle(client, { schema: { ...authSchema, ...deesseSchema } })
  const database = drizzleAdapter(drizzleDatabase)
  return createDeesse({ database, ...deesseConfig })
}

declare module "deesse/react" {
  interface DeesseReactRegistry {
    example: {
      router: Awaited<ReturnType<typeof createDeesseApp>>["api"]["router"]
    }
  }
}

