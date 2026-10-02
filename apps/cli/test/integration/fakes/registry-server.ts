/**
 * Fake DeesseJS registry server for integration tests.
 *
 * Spawns an `http.createServer` on a random local port and
 * answers the routes the SDK hits at runtime:
 *
 *   GET  /api/v1/registry/catalog
 *   POST /api/v1/registry/fetch-descriptor
 *   GET  /api/v1/registry/templates/<slug>/info
 *   GET  /raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>
 *
 * The catalogue is mutable from the test — `setCatalogue`
 * replaces it after the server has started. Tests can pre-load
 * fixtures (one or more `FakeCatalogEntry`) before launching the
 * CLI; later tests can mutate the catalogue to exercise paths
 * like "descriptor fails Zod validation".
 *
 * **Why we serve `raw.githubusercontent.com` here too**:
 * the SDK reads `DEESSEJS_GITHUB_RAW_BASE` (default
 * `https://raw.githubusercontent.com`); the test sets the env
 * to the fake server's URL. The fake serves the same paths
 * the real GitHub raw host serves, so the SDK code path is
 * identical between test and prod.
 *
 * **Why a single server, not separate ones per route family**:
 * one `http.createServer` listens on one random port, fewer
 * moving parts, and tests need only one URL to wire.
 *
 * **No fixtures needed** — pass the catalogue and `files[]` you
 * want as `FakeCatalogEntry` objects.
 */

import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http"

/** One template entry the registry serves. */
export type FakeCatalogEntry = {
  slug: string
  title: string
  description?: string
  layer: "open-community" | "pro" | "enterprise"
  latestVersion: string
  owner: string
  repo: string
  /** The descriptor body — should already pass `TemplateV2.safeParse`. */
  descriptor: Record<string, unknown>
  /**
   * Per-file content served at
   * `GET /raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>`. The
   * fake returns 404 for paths not listed here.
   */
  files: Record<string, string>
}

export type FakeRegistryServer = {
  /** Base URL — pass to `DEESSEJS_API_URL` and `DEESSEJS_GITHUB_RAW_BASE`. */
  readonly url: string
  readonly catalogue: readonly FakeCatalogEntry[]
  /** Replace the catalogue. Triggers re-render on next request. */
  setCatalogue(entries: readonly FakeCatalogEntry[]): void
  /** Mark a path as 404'd (descriptor present, file missing). */
  setFileMissing(owner: string, repo: string, ref: string, path: string): void
  /** Stop the server. Always call in `afterEach`. */
  close(): Promise<void>
}

const send = (
  res: ServerResponse,
  status: number,
  body: unknown,
  contentType = "application/json",
): void => {
  res.statusCode = status
  res.setHeader("content-type", contentType)
  res.end(JSON.stringify(body))
}

const sendText = (
  res: ServerResponse,
  status: number,
  body: string,
  contentType = "text/plain",
): void => {
  res.statusCode = status
  res.setHeader("content-type", contentType)
  res.end(body)
}

/**
 * Start a fake registry. The promise resolves with the server
 * bound to a random local port.
 */
export const startFakeRegistry = async (
  initial: readonly FakeCatalogEntry[] = [],
): Promise<FakeRegistryServer> => {
  let catalogue: FakeCatalogEntry[] = [...initial]
  const missingFiles = new Set<string>()

  const handle = (
    req: IncomingMessage,
    res: ServerResponse,
  ): void => {
    if (!req.url || !req.method) {
      send(res, 400, { error: "bad request" })
      return
    }
    const url = new URL(req.url, "http://x")
    const path = url.pathname
    const method = req.method

    // raw.githubusercontent.com/<owner>/<repo>/<ref>/<path...>
    if (path.startsWith("/raw.githubusercontent.com/")) {
      const m =
        /^\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(
          path,
        )
      if (m === null) {
        sendText(res, 404, "not found", "text/plain")
        return
      }
      const owner = m[1] ?? ""
      const repo = m[2] ?? ""
      const ref = m[3] ?? ""
      const filePath = m[4] ?? ""
      const key = `${owner}/${repo}/${ref}/${filePath}`
      if (missingFiles.has(key)) {
        sendText(res, 404, "not found", "text/plain")
        return
      }
      const entry = catalogue.find(
        (e) => e.owner === owner && e.repo === repo,
      )
      const fileBody = entry?.files[filePath]
      if (fileBody === undefined) {
        sendText(res, 404, "not found", "text/plain")
        return
      }
      // The descriptor is JSON; everything else is plain text.
      const contentType =
        filePath === "deesse-template.json" || filePath.endsWith(".json")
          ? "application/json"
          : "text/plain"
      sendText(res, 200, fileBody, contentType)
      return
    }

    // /api/v1/registry/catalog — wire shape is `{ catalog: CatalogEntry[] }`
    // per the SDK's parseCatalogResponse (`packages/registry-client/src/http-client.ts`).
    if (method === "GET" && path === "/api/v1/registry/catalog") {
      send(
        res,
        200,
        {
          catalog: catalogue.map((e) => ({
            slug: e.slug,
            title: e.title,
            ...(e.description !== undefined ? { description: e.description } : {}),
            layer: e.layer,
            latestVersion: e.latestVersion,
          })),
        },
      )
      return
    }

    // /api/v1/registry/fetch-descriptor
    if (method === "POST" && path === "/api/v1/registry/fetch-descriptor") {
      let raw = ""
      req.on("data", (chunk: Buffer) => {
        raw += chunk.toString("utf8")
      })
      req.on("end", () => {
        let body: { slug?: unknown; ref?: unknown } = {}
        try {
          body = JSON.parse(raw) as typeof body
        } catch {
          send(res, 400, { error: "invalid JSON" })
          return
        }
        const slug = body.slug
        if (typeof slug !== "string") {
          send(res, 400, { error: "missing slug" })
          return
        }
        const ref =
          typeof body.ref === "string" ? body.ref : "main"
        const entry = catalogue.find((e) => e.slug === slug)
        if (entry === undefined) {
          send(res, 404, {
            error: `unknown slug: ${slug}`,
            code: "unknown_slug",
          })
          return
        }
        const files: Record<string, string> = {}
        for (const filePath of Object.keys(entry.files)) {
          files[filePath] = `${resolveOwn(req)}/raw.githubusercontent.com/${entry.owner}/${entry.repo}/${ref}/${filePath}`
        }
        send(res, 200, { descriptor: entry.descriptor, files })
      })
      return
    }

    // /api/v1/registry/templates/<slug>/info
    const infoMatch = /^\/api\/v1\/registry\/templates\/([^/]+)\/info$/.exec(
      path,
    )
    if (method === "GET" && infoMatch !== null) {
      const slug = infoMatch[1] ?? ""
      const entry = catalogue.find((e) => e.slug === slug)
      if (entry === undefined) {
        send(res, 404, { error: `unknown slug: ${slug}` })
        return
      }
      send(res, 200, {
        slug: entry.slug,
        title: entry.title,
        ...(entry.description !== undefined
          ? { description: entry.description }
          : {}),
        layer: entry.layer,
        latestVersion: entry.latestVersion,
        versions: [entry.latestVersion],
        ...(entry.descriptor["labels"] !== undefined
          ? { labels: entry.descriptor["labels"] }
          : {}),
      })
      return
    }

    send(res, 404, { error: "not found", path, method })
  }

  // Resolve the host this request came in on so we can hand the
  // client back absolute URLs (the SDK uses them to fetch files).
  // This is `127.0.0.1:<port>` for our test setup.
  const server: Server = createServer((req, res) => handle(req, res))
  const port = await new Promise<number>((resolveFn, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      if (addr === null || typeof addr === "string") {
        reject(new Error("server.listen did not return a port"))
        return
      }
      resolveFn(addr.port)
    })
  })
  const url = `http://127.0.0.1:${port}`

  return {
    url,
    catalogue,
    setCatalogue: (entries) => {
      catalogue = [...entries]
    },
    setFileMissing: (owner, repo, ref, path) => {
      missingFiles.add(`${owner}/${repo}/${ref}/${path}`)
    },
    close: () =>
      new Promise<void>((resolveFn, reject) => {
        server.close((err) => (err ? reject(err) : resolveFn()))
      }),
  }
}

// Resolve the host the request reached us on. For tests, this is
// always the loopback address. We capture it once at server boot
// because `req.headers.host` is the same for every request and
// never changes during the test.
const resolveOwn = (req: IncomingMessage): string => {
  const host = req.headers.host ?? "127.0.0.1"
  return `http://${host}`
}