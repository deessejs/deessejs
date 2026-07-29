import "@workspace/env/server"

import { defineConfig } from "drizzle-kit"
import { serverEnv } from "@workspace/env/server"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
})
