import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { drizzleAdapter } from "@deessejs/drizzle-adapter"
import * as schema from "./schema/index.js"

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/deesse_next_example"
const client = postgres(connectionString, { max: 1, prepare: false })
const drizzleDatabase = drizzle(client, { schema })

export const database = drizzleAdapter(drizzleDatabase)
