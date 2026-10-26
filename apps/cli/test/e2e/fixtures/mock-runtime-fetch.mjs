import { appendFileSync, readFileSync } from "node:fs"
import process from "node:process"
import { URL } from "node:url"

const repository = "deessejs/init-regression-fixture"
const revision = "0123456789abcdef0123456789abcdef01234567"
const archivePath = process.env.DEESSEJS_INIT_FIXTURE_ARCHIVE
const tracePath = process.env.DEESSEJS_INIT_FETCH_TRACE

if (!archivePath || !tracePath) {
  throw new Error("init E2E fixture environment is incomplete")
}
const archive = readFileSync(archivePath)

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
    githubPath === `/repos/${repository}/tarball/${revision}`
  ) {
    return new globalThis.Response(archive, {
      status: 200,
      headers: { "content-type": "application/gzip" },
    })
  }

  throw new Error(
    `Unexpected network request from the CLI init E2E test: ${method} ${requestUrl.href}`
  )
}
