import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repositoryRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)))

describe("admin integration ownership", () => {
  it("keeps admin concepts out of the Deesse runtime and plugin contracts", async () => {
    const files = ["apps/deesse/src/index.ts", "apps/deesse/src/runtime.ts", "apps/deesse/src/types.ts"]
    const sources = await Promise.all(files.map((file) => readFile(resolve(repositoryRoot, file), "utf8")))
    const frameworkSources = sources.map((source) => source.replace(
      /export \{ resolveAdminAccess, type AdminAccess \} from "\.\/admin-access\.js"\s*/,
      "",
    ))

    expect(frameworkSources.join("\n")).not.toMatch(/admin/i)
    expect(sources[0]).not.toMatch(/@deessejs\/admin|adminPage|requires:\s*\[[^\]]*admin/i)
  })

  it("keeps the ordinary posts plugin independent from the admin package", async () => {
    const postsPlugin = await readFile(
      resolve(repositoryRoot, "examples/next-shadcn-monorepo/apps/web/plugins/posts.ts"),
      "utf8",
    )

    expect(postsPlugin).not.toMatch(/@deessejs\/admin|adminPage|requires:\s*\[[^\]]*admin/i)
  })
})
