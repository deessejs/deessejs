import { appendFileSync, readFileSync } from "node:fs"
import process from "node:process"
import { URL } from "node:url"

const revision = "0123456789abcdef0123456789abcdef01234567"
const missingDescriptorRevision = "9876543210abcdef9876543210abcdef98765432"
const archivePath = process.env.DEESSEJS_INIT_FIXTURE_ARCHIVE
const descriptorPath = process.env.DEESSEJS_INIT_FIXTURE_DESCRIPTOR
const missingDescriptorArchivePath =
  process.env.DEESSEJS_INIT_MISSING_DESCRIPTOR_ARCHIVE
const tracePath = process.env.DEESSEJS_INIT_FETCH_TRACE

if (
  !archivePath ||
  !descriptorPath ||
  !missingDescriptorArchivePath ||
  !tracePath
) {
  throw new Error("init E2E fixture environment is incomplete")
}
const archive = readFileSync(archivePath)
const descriptor = readFileSync(descriptorPath)
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
  ["deessejs/init-regression-fixture", { revision, archive, descriptor }],
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
  if (subpath === "commits/main" || subpath === "commits/HEAD") {
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

function appResponse(requestUrl, method) {
  if (requestUrl.hostname !== "app.deessejs.com") return null
  if (requestUrl.pathname === "/api/v1/version") {
    return jsonResponse({ version: "2.1.0", minSupported: "1.0.0" })
  }
  if (
    requestUrl.pathname === "/api/v1/rpc/templates/resolve" &&
    method === "POST"
  ) {
    return new globalThis.Response(null, { status: 404 })
  }
  if (
    requestUrl.pathname === "/api/v1/rpc/templates/list" &&
    method === "POST"
  ) {
    return jsonResponse({
      json: { templates: [template, legacyCatalogTemplate] },
    })
  }
  return null
}

function githubContentsResponse(requestUrl) {
  const match =
    /^\/repos\/([^/]+\/[^/]+)\/contents\/deesse-template\.json$/.exec(
      requestUrl.pathname
    )
  if (!match) return null
  const fixture = githubRepositories.get(match[1])
  if (fixture?.descriptor) {
    return jsonResponse({
      type: "file",
      encoding: "base64",
      content: fixture.descriptor.toString("base64"),
      size: fixture.descriptor.byteLength,
    })
  }
  return new globalThis.Response(null, { status: 404 })
}

function githubApiResponse(requestUrl) {
  if (requestUrl.hostname !== "api.github.com") return null
  return (
    githubResponse(requestUrl.pathname) ?? githubContentsResponse(requestUrl)
  )
}

globalThis.fetch = async (input, init) => {
  const requestUrl = new URL(
    input instanceof globalThis.Request ? input.url : String(input)
  )
  const method =
    init?.method ?? (input instanceof globalThis.Request ? input.method : "GET")
  appendFileSync(tracePath, `${method.toUpperCase()} ${requestUrl.href}\n`)

  const response =
    appResponse(requestUrl, method) ?? githubApiResponse(requestUrl)
  if (response) return response
  throw new Error(
    `Unexpected network request from the CLI init E2E test: ${method} ${requestUrl.href}`
  )
}
