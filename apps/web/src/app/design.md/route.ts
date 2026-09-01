import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const dynamic = "force-static"

export async function GET() {
  const sourcePath = join(process.cwd(), "src/app/design.md/source.md")
  const body = await readFile(sourcePath, "utf8")

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
