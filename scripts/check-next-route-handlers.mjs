import { readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { pathToFileURL } from "node:url"

const allowed = `apps/app/app/api/[[...route]]/route.ts`

async function walk(root, dir, found) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(root, path, found)
    else if (/^route\.[cm]?[jt]sx?$/.test(entry.name)) {
      found.push(relative(root, path).split(sep).join("/"))
    }
  }
}

export async function findRouteHandlers(root) {
  const found = []
  await Promise.all(["apps/app", "apps/web"].map((app) => walk(root, join(root, app), found)))
  return found
}

export async function checkRouteHandlers(root) {
  const found = await findRouteHandlers(root)
  return { found, violations: found.filter((path) => path !== allowed), allowed }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkRouteHandlers(process.cwd())
  if (!result.found.includes(allowed) || result.violations.length) {
    console.error(`Only ${allowed} may define a Next.js route handler in apps/app and apps/web.`)
    for (const path of result.violations) console.error(`Unexpected handler: ${path}`)
    process.exitCode = 1
  }
}
