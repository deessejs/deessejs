import { createServer, type IncomingMessage } from "node:http"
import type { AddressInfo } from "node:net"

export type FakeApiHandler = (req: IncomingMessage) => {
  status: number
  body?: string
}

export type FakeApi = {
  url: string
  close: () => Promise<void>
}

export type StartFakeApiOpts = {
  templates?: unknown[]
  handler?: FakeApiHandler
}

export const startFakeApi = async (
  opts: StartFakeApiOpts = {},
): Promise<FakeApi> => {
  const { templates = [], handler } = opts
  const defaultHandler: FakeApiHandler = () => ({
    status: 200,
    body: JSON.stringify({ templates }),
  })
  const server = createServer((req, res) => {
    const result = (handler ?? defaultHandler)(req)
    res.writeHead(result.status, { "content-type": "application/json" })
    res.end(result.body ?? "")
  })
  await new Promise<void>((resolveFn) => server.listen(0, resolveFn))
  const port = (server.address() as AddressInfo).port
  return {
    url: `http://127.0.0.1:${port}/api/templates`,
    close: () =>
      new Promise<void>((resolveFn) => {
        server.close(() => resolveFn())
      }),
  }
}
