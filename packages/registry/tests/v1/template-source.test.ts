import { describe, expect, it, vi } from "vitest"
import {
  createGitHubTemplateSourceAdapter,
} from "../../src/v1/template-source.js"
import type { TemplateSourceError } from "../../src/v1/template-source.js"

const REVISION = "0123456789abcdef0123456789abcdef01234567"
const BLOB_SHA = "abcdef0123456789abcdef0123456789abcdef01"

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("createGitHubTemplateSourceAdapter", () => {
  it("pins the snapshot to one commit and reads file bytes from that commit", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/commits/v1.0.0")) return jsonResponse({ sha: REVISION })
      if (url.includes(`/git/trees/${REVISION}?recursive=1`)) {
        return jsonResponse({
          truncated: false,
          tree: [
            {
              path: "assets/font.woff2",
              mode: "100644",
              type: "blob",
              sha: BLOB_SHA,
              size: 4,
            },
          ],
        })
      }
      if (url.endsWith(`/git/blobs/${BLOB_SHA}`)) {
        return jsonResponse({ encoding: "base64", content: "AP8QgA==" })
      }
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    const snapshot = await adapter.resolve({
      repository: "DeesseJS/fixture",
      ref: "v1.0.0",
    })
    const contents = await snapshot.readFile("assets/font.woff2")

    expect(snapshot.repository).toBe("deessejs/fixture")
    expect(snapshot.revision).toBe(REVISION)
    expect(contents).toEqual(Uint8Array.from([0, 255, 16, 128]))
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("fails explicitly when GitHub reports a truncated inventory", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/commits/main")) return jsonResponse({ sha: REVISION })
      return jsonResponse({ truncated: true, tree: [] })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    await expect(
      adapter.resolve({ repository: "deessejs/fixture", ref: "main" }),
    ).rejects.toMatchObject({
      code: "source.incomplete_inventory",
    } satisfies Partial<TemplateSourceError>)
  })
})
