import { afterEach, describe, expect, it, vi } from "vitest"

import {
  GitHubAppRequestError,
  requestGitHubAppJson,
} from "../../src/core/github-app/request.js"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("requestGitHubAppJson", () => {
  it("returns successfully parsed JSON and supplies a timeout signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', { status: 200 })
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await requestGitHubAppJson("https://api.github.com/user", {})

    expect(result.data).toEqual({ ok: true })
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it("maps a stalled request to a stable timeout failure", async () => {
    const fetchMock = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          })
        })
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      requestGitHubAppJson("https://api.github.com/user", {}, { timeoutMs: 5 })
    ).rejects.toMatchObject({
      name: "GitHubAppRequestError",
      failure: "timeout",
    })
  })

  it("rejects an oversized streamed response before parsing it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(5))
              controller.close()
            },
          })
        )
      )
    )

    await expect(
      requestGitHubAppJson(
        "https://api.github.com/user",
        {},
        { maxResponseBytes: 4 }
      )
    ).rejects.toMatchObject({ failure: "response_too_large" })
  })

  it("rejects malformed JSON without exposing response content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{")))

    await expect(
      requestGitHubAppJson("https://api.github.com/user", {})
    ).rejects.toMatchObject({
      failure: "invalid_json",
      message: "GitHub App request failed",
    })
  })

  it("maps GitHub error responses to a stable failure and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"message":"private upstream detail"}', {
            status: 503,
          })
        )
    )

    await expect(
      requestGitHubAppJson("https://api.github.com/user", {})
    ).rejects.toMatchObject({
      failure: "upstream",
      status: 503,
      message: "GitHub App request failed",
    } satisfies Partial<GitHubAppRequestError>)
  })
})
