import { appendFileSync, readFileSync } from "node:fs"
import process from "node:process"
import { URL } from "node:url"

const revision = "0123456789abcdef0123456789abcdef01234567"
const missingDescriptorRevision = "9876543210abcdef9876543210abcdef98765432"
const archivePath = process.env.DEESSEJS_INIT_FIXTURE_ARCHIVE
const missingDescriptorArchivePath =
  process.env.DEESSEJS_INIT_MISSING_DESCRIPTOR_ARCHIVE
const tracePath = process.env.DEESSEJS_INIT_FETCH_TRACE

if (!archivePath || !missingDescriptorArchivePath || !tracePath) {
  throw new Error("init E2E fixture environment is incomplete")
}
const archive = readFileSync(archivePath)
const missingDescriptorArchive = readFileSync(missingDescriptorArchivePath)

const jsonResponse = (body) =>
  new globalThis.Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  })

const template = {
  slug: "init-regression-fixture",
  name: "CLI init regression fixture",
  description: "Fixed template fixture for the CLI init E2E test.",
  owner: "deessejs",
  repo: "init-regression-fixture",
  cloneUrl: "https://github.com/deessejs/init-regression-fixture",
  license: "MIT",
  category: "test",
  labels: [],
  layer: "open-community",
}
const legacyCatalogTemplate = {
  ...template,
  slug: "legacy-starter",
  name: "Legacy template without a descriptor",
  owner: "deessejs",
  repo: "legacy-template",
  cloneUrl: "https://github.com/deessejs/legacy-template",
}

const githubRepositories = new Map([
  ["deessejs/init-regression-fixture", { revision, archive }],
  [
    "deessejs/legacy-template",
    {
      revision: missingDescriptorRevision,
      archive: missingDescriptorArchive,
    },
  ],
])

const githubResponse = (pathname) => {
  const match = /^\/repos\/([^/]+\/[^/]+)(?:\/(.*))?$/.exec(pathname)
  const repository = match?.[1]
  const subpath = match?.[2]
  const fixture = repository ? githubRepositories.get(repository) : undefined
  if (!fixture) return null
  if (!subpath) return jsonResponse({ default_branch: "main" })
  if (subpath === "commits/main") {
    return jsonResponse({ sha: fixture.revision })
  }

  const archiveMatch = /^tarball\/([a-f0-9]+)$/.exec(subpath)
  if (!archiveMatch) return null
  if (archiveMatch[1] !== fixture.revision) {
    throw new Error(`Unexpected archive revision for ${repository}`)
  }
  return new globalThis.Response(fixture.archive, {
    status: 200,
    headers: { "content-type": "application/gzip" },
  })
}

globalThis.fetch = async (input, init) => {
  const requestUrl = new URL(
    input instanceof globalThis.Request ? input.url : String(input)
  )
  const method =
    init?.method ?? (input instanceof globalThis.Request ? input.method : "GET")
  appendFileSync(tracePath, `${method.toUpperCase()} ${requestUrl.href}\n`)

  if (
    requestUrl.hostname === "app.deessejs.com" &&
    requestUrl.pathname === "/api/v1/version"
  ) {
    return jsonResponse({ version: "2.1.0", minSupported: "1.0.0" })
  }

  if (
    requestUrl.hostname === "app.deessejs.com" &&
    requestUrl.pathname === "/api/v1/rpc/templates/list" &&
    method === "POST"
  ) {
    return jsonResponse({
      json: { templates: [template, legacyCatalogTemplate] },
    })
  }

  if (requestUrl.hostname === "api.github.com") {
    const response = githubResponse(requestUrl.pathname)
    if (response) return response
  }

  throw new Error(
    `Unexpected network request from the CLI init E2E test: ${method} ${requestUrl.href}`
  )
}
