import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/deesse_adapter_test"

export default defineConfig({
  dialect: "postgresql",
  schema: "./tests/fixtures/schema.ts",
  out: "./tests/fixtures/migrations",
  dbCredentials: { url: databaseUrl },
})
