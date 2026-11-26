import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repositoryRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)))

describe("admin integration ownership", () => {
  it("keeps admin-specific concepts out of the generic Deesse runtime and plugin contracts", async () => {
    const files = ["apps/deesse/src/index.ts", "apps/deesse/src/runtime.ts", "apps/deesse/src/types.ts"]
    const sources = await Promise.all(files.map((file) => readFile(resolve(repositoryRoot, file), "utf8")))

    expect(sources.join("\n")).not.toMatch(/admin/i)
  })

  it("keeps the Deesse core and server-only Blog export free of UI runtime imports", async () => {
    const files = [
      "apps/deesse/src/index.ts",
      "apps/deesse/src/plugins/blog/index.ts",
      "apps/deesse/src/plugins/blog/api.ts",
      "apps/deesse/src/runtime.ts",
    ]
    const sources = await Promise.all(files.map((file) => readFile(resolve(repositoryRoot, file), "utf8")))
    expect(sources.join("\n")).not.toMatch(/from ["'](?:react|react-dom|next\/|@deessejs\/ui)/)

    const manifest = JSON.parse(await readFile(resolve(repositoryRoot, "apps/deesse/package.json"), "utf8"))
    for (const peer of ["react", "react-dom", "next", "@deessejs/ui"]) {
      expect(manifest.peerDependenciesMeta[peer]?.optional).toBe(true)
    }
    expect(manifest.exports["./plugins/admin"]).toBeDefined()
    expect(manifest.exports["./plugins/admin/next"]).toBeDefined()
    expect(manifest.exports["./plugins/blog/admin"]).toBeDefined()
    expect(manifest.exports["./plugins/admin/styles.css"]).toBeDefined()
  })

  it("keeps the ordinary posts plugin independent from the Admin plugin", async () => {
    const postsPlugin = await readFile(
      resolve(repositoryRoot, "examples/next-shadcn-monorepo/apps/web/plugins/posts.ts"),
      "utf8",
    )

    expect(postsPlugin).not.toMatch(/deesse\/plugins\/admin|adminPage|requires:\s*\[[^\]]*admin/i)
  })
})
