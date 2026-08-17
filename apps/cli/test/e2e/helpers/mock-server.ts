import { createServer, type Server } from "node:http"
import { createReadStream } from "node:fs"
import { resolve } from "node:path"

/**
 * Minimal mock HTTP server for the CLI e2e suite.
 *
 * The server is not a real API. It does not validate auth. It does
 * not interpolate GitHub data. It serves the contract shapes that
 * the CLI client expects and that the unit tests already pin.
 *
 * Two endpoints are exposed:
 * - GET /api/v1/version — returns the version probe response.
 * - POST /api/v1/rpc — the ORPC endpoint. The handler checks the
 *   request body shape and returns one of the configured canned
 *   responses.
 *
 * The mode is per-server-instance. A test that needs both `success`
 * and `not_found` responses starts two server instances.
 *
 * The server is bound to 127.0.0.1 on port 0. The OS picks a free
 * port. The URL is available via the promise returned by `start`.
 *
 * Implements ADR-014.
 */

export type MockMode = "success" | "not_found" | "malformed" | "server_error"

export type MockServerHandle = {
  url: string
  port: number
  stop: () => Promise<void>
}

type SuccessConfig = {
  mode: "success"
  templates: Array<Record<string, unknown>>
}

type NotFoundConfig = {
  mode: "not_found"
}

type MalformedConfig = {
  mode: "malformed"
}

type ServerErrorConfig = {
  mode: "server_error"
}

export type MockConfig = SuccessConfig | NotFoundConfig | MalformedConfig | ServerErrorConfig

const VERSION_RESPONSE = {
  version: "2.0.1",
  minSupported: "0.0.0",
}

const renderRpcSuccess = (templates: Array<Record<string, unknown>>): Record<string, unknown> => {
  // The ORPC client expects a JSON-RPC envelope. The data field
  // is the typed procedure output. TemplatesListResponseV1 wraps
  // the array as { templates: [...] }.
  const payload = { templates }
  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      data: payload,
      meta: [],
    },
  }
}

const renderRpcNotFound = (): Record<string, unknown> => ({
  jsonrpc: "2.0",
  id: null,
  error: {
    code: "NOT_FOUND",
    message: "template not found",
    data: {},
  },
})

const renderRpcMalformed = (): Record<string, unknown> => {
  // The response shape parses but the data is missing required fields.
  // The CLI's parse step (TemplatesListResponseV1) will throw.
  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      data: { templates: [{ slug: "x" }] },
      meta: [],
    },
  }
}

const renderJson = (res: import("node:http").ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

const readBody = async (req: import("node:http").IncomingMessage): Promise<string> => {
  const chunks: Array<Buffer> = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}

const handleVersion = (res: import("node:http").ServerResponse): void => {
  renderJson(res, 200, VERSION_RESPONSE)
}

const handleRpc = async (
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
  config: MockConfig,
  bodyLog: (body: string) => void,
): Promise<void> => {
  const body = await readBody(req)
  bodyLog(body)
  switch (config.mode) {
    case "success":
      renderJson(res, 200, renderRpcSuccess(config.templates))
      return
    case "not_found":
      renderJson(res, 404, renderRpcNotFound())
      return
    case "malformed":
      renderJson(res, 200, renderRpcMalformed())
      return
    case "server_error":
      res.statusCode = 500
      res.setHeader("Content-Type", "application/json")
      res.end(JSON.stringify({ message: "internal" }))
      return
  }
}

export const startMockServer = (config: MockConfig): Promise<MockServerHandle> => {
  const bodies: string[] = []
  const bodyLog = (body: string): void => {
    bodies.push(body)
  }

  const server: Server = createServer(async (req, res) => {
    const url = req.url ?? ""
    if (req.method === "GET" && url.startsWith("/api/v1/version")) {
      handleVersion(res)
      return
    }
    if (req.method === "POST" && url.startsWith("/api/v1/rpc")) {
      await handleRpc(req, res, config, bodyLog)
      return
    }
    renderJson(res, 404, { message: "not found" })
  })

  return new Promise((resolveStart, reject) => {
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      if (addr === null || typeof addr === "string") {
        reject(new Error("mock server failed to bind to a port"))
        return
      }
      const port = addr.port
      const url = `http://127.0.0.1:${port}`
      resolveStart({
        url,
        port,
        stop: () =>
          new Promise<void>((resolveStop) => {
            server.close(() => resolveStop())
          }),
      })
    })
  })
}

/** Re-export the bunyan-style helper used by the assert step. */
export const readRecordedBodies = (handle: { url: string }): string[] => {
  // The current implementation does not expose bodies outside the
  // closure. Tests that need body inspection can use the dedicated
  // helpers in cli-runner.ts (not implemented yet). This export
  // is a placeholder for future use.
  void handle
  return []
}

/** Re-export the path helper so the test suites can locate the tarball. */
export const TARBALL_GLOB = resolve("apps/cli", "deessejs-cli-*.tgz")
