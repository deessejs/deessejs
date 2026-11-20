import "dotenv/config"
import { os } from "@orpc/server"
import { createDeesse } from "deesse"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { drizzleAdapter } from "@deessejs/drizzle-adapter"
import * as authSchema from "./.deesse/generated/auth.schema.ts"
import * as deesseSchema from "./.deesse/generated/deesse.schema.ts"
import { plugins } from "./plugins/index.ts"

const client = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/deesse_next_example", {
  max: 1,
  prepare: false,
})

const database = drizzle(client, { schema: { ...authSchema, ...deesseSchema } })

export const deesse = createDeesse({
  database: drizzleAdapter(database),
  auth: {
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET ?? "local-only-deesse-next-example-secret",
    emailAndPassword: { enabled: true },
  },
  api: { router: os.router({ health: os.handler(() => ({ status: "ok" as const })) }) },
  plugins,
})
