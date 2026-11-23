import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { loadDotenvSnapshotFrom } from "../../src/loader.js"

describe("local agent dotenv isolation", () => {
  it("does not load root dotenv files for a sanitized local runtime", () => {
    const root = mkdtempSync(join(tmpdir(), "deesse-local-env-"))
    writeFileSync(
      join(root, ".env"),
      "R2_SECRET_ACCESS_KEY=dotenv-r2-marker\nSTRIPE_SECRET_KEY=dotenv-stripe-marker\n"
    )
    writeFileSync(
      join(root, ".env.development.local"),
      "GITHUB_TOKEN=dotenv-github-marker\n"
    )

    try {
      const snapshot = loadDotenvSnapshotFrom(root, {
        NODE_ENV: "development",
        DEV_AGENT_LOCAL_RUNTIME: "true",
        DATABASE_URL: "postgresql://worktree@127.0.0.1/worktree_db",
        R2_SECRET_ACCESS_KEY: "",
      })

      expect(snapshot.DATABASE_URL).toBe(
        "postgresql://worktree@127.0.0.1/worktree_db"
      )
      expect(snapshot.R2_SECRET_ACCESS_KEY).toBe("")
      expect(snapshot.STRIPE_SECRET_KEY).toBeUndefined()
      expect(snapshot.GITHUB_TOKEN).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it("retains regular dotenv loading outside the local agent runtime", () => {
    const root = mkdtempSync(join(tmpdir(), "deesse-env-"))
    writeFileSync(join(root, ".env"), "EXAMPLE_VALUE=file-value\n")

    try {
      const snapshot = loadDotenvSnapshotFrom(root, {
        NODE_ENV: "development",
      })
      expect(snapshot.EXAMPLE_VALUE).toBe("file-value")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
