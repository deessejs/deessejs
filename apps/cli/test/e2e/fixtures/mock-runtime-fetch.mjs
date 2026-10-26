import { appendFileSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import process from "node:process"
import { URL } from "node:url"

const repository = "deessejs/init-regression-fixture"
const revision = "0123456789abcdef0123456789abcdef01234567"
const fixtureDirectory = process.env.DEESSEJS_INIT_FIXTURE_DIRECTORY
const tracePath = process.env.DEESSEJS_INIT_FETCH_TRACE

if (!fixtureDirectory || !tracePath) {
  throw new Error("init E2E fixture environment is incomplete")
}

const collectFiles = (directory) => {
  const files = []
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry)
    const details = statSync(absolutePath)
    if (details.isDirectory()) {
      files.push(...collectFiles(absolutePath))
    } else {
      files.push({
        path: relative(fixtureDirectory, absolutePath).split(sep).join("/"),
        contents: readFileSync(absolutePath),
      })
    }
  }
  return files
}

const files = collectFiles(fixtureDirectory)
const blobShaByPath = new Map(
  files.map((file, index) => [
    file.path,
    `${String(index + 1).padStart(40, "0")}`,
  ])
)
const filesBySha = new Map(
  files.map((file) => [blobShaByPath.get(file.path), file])
)

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
    return jsonResponse({ json: { templates: [template] } })
  }

  const githubPath = requestUrl.pathname
  if (
    requestUrl.hostname === "api.github.com" &&
    githubPath === `/repos/${repository}`
  ) {
    return jsonResponse({ default_branch: "main" })
  }

  if (
    requestUrl.hostname === "api.github.com" &&
    githubPath === `/repos/${repository}/commits/main`
  ) {
    return jsonResponse({ sha: revision })
  }

  if (
    requestUrl.hostname === "api.github.com" &&
    githubPath === `/repos/${repository}/git/trees/${revision}` &&
    requestUrl.searchParams.get("recursive") === "1"
  ) {
    return jsonResponse({
      truncated: false,
      tree: files.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobShaByPath.get(file.path),
        size: file.contents.byteLength,
      })),
    })
  }

  const blobMatch = new RegExp(
    `^/repos/${repository}/git/blobs/([0-9a-f]{40})$`
  ).exec(githubPath)
  const blob = blobMatch?.[1] ? filesBySha.get(blobMatch[1]) : undefined
  if (blob) {
    return jsonResponse({
      encoding: "base64",
      content: blob.contents.toString("base64"),
    })
  }

  throw new Error(
    `Unexpected network request from the CLI init E2E test: ${method} ${requestUrl.href}`
  )
}
