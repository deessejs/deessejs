import assert from "node:assert/strict"
import test from "node:test"
import {
  appUrlEnvironment,
  replaceEnvironmentLines,
} from "./dev-agent-env.mjs"

test("port selection replaces stale worktree URLs and adds missing URL values", () => {
  const lines = [
    "NODE_ENV=development",
    "DEV_AGENT_PORT=48883",
    "APP_URL=http://localhost:48883",
    "API_BASE_URL=http://localhost:48883",
    "BETTER_AUTH_URL=http://localhost:48883",
    "WEB_URL=http://localhost:48883",
    "DOCS_URL=http://localhost:48883",
    "NEXT_PUBLIC_APP_URL=http://localhost:48883",
    "NEXT_PUBLIC_API_BASE_URL=http://localhost:48883",
    "PRIVATE_FIXTURE_VALUE=keep-without-reading",
  ]
  const updates = {
    DEV_AGENT_PORT: "48884",
    ...appUrlEnvironment("48884"),
  }

  const result = replaceEnvironmentLines(lines, updates)

  for (const [key, value] of Object.entries(updates)) {
    assert.ok(result.includes(`${key}=${value}`), `${key} follows selected port`)
  }
  assert.ok(result.includes("PRIVATE_FIXTURE_VALUE=keep-without-reading"))
})
