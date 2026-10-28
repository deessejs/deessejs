import { createStorybookMcpHandler } from "@storybook/mcp"

const manifestPaths = new Map([
  ["./manifests/components.json", "/manifests/components.json"],
  ["./manifests/docs.json", "/manifests/docs.json"],
])

const storybookMcpHandler = createStorybookMcpHandler({
  manifestProvider: async (request, path) => {
    if (!request) {
      throw new Error("The Storybook MCP request is missing.")
    }

    const pathname = manifestPaths.get(path)
    if (!pathname) {
      throw new Error("The requested Storybook manifest is not supported.")
    }

    const manifestUrl = new URL(pathname, request.url)
    const response = await fetch(manifestUrl)
    if (!response.ok) {
      throw new Error(`Unable to load Storybook manifest: ${response.status}.`)
    }

    return response.text()
  },
})

export default async function handler(request: Request): Promise<Response> {
  return (await storybookMcpHandler)(request)
}
