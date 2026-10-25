import { describe, expect, it, vi } from "vitest"

import { findInvalidTag } from "../src/tags.js"
import { ResendTransport } from "../src/transports/resend.js"

/**
 * The Resend SDK is mocked wholesale: these cases are about the
 * payload the transport builds, not about the network.
 */
const sendMock = vi.hoisted(() => vi.fn())

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

describe("Resend tag contract", () => {
  it("accepts the tags the app sends", () => {
    expect(findInvalidTag([{ name: "flow", value: "verify-email" }])).toBeNull()
    expect(findInvalidTag([{ name: "playbook", value: "v0-1" }])).toBeNull()
  })

  it("rejects a dot in the value", () => {
    expect(findInvalidTag([{ name: "playbook", value: "v0.1" }])).toEqual({
      index: 0,
      name: "playbook",
      value: "v0.1",
    })
  })

  it("rejects a dot in the name", () => {
    expect(findInvalidTag([{ name: "play.book", value: "download" }])).toEqual({
      index: 0,
      name: "play.book",
      value: "download",
    })
  })

  it("reports the index of the offending tag", () => {
    const invalid = findInvalidTag([
      { name: "flow", value: "verify-email" },
      { name: "playbook", value: "v0.1" },
    ])

    expect(invalid?.index).toBe(1)
  })

  it("returns null when there is no tag at all", () => {
    expect(findInvalidTag(undefined)).toBeNull()
  })
})

describe("ResendTransport tag validation", () => {
  const transport = () =>
    new ResendTransport({
      apiKey: "re_test",
      from: "DeesseJS <hello@deessejs.com>",
    })

  it("refuses a tag the API would reject, without calling it", async () => {
    const result = await transport().send({
      to: "reader@example.com",
      subject: "Your playbook",
      tags: [{ name: "playbook", value: "v0.1" }],
    })

    expect(result).toHaveProperty("error")
    expect((result as { error: string }).error).toContain("playbook")
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("sends a valid tag", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null })

    const result = await transport().send({
      to: "reader@example.com",
      subject: "Your playbook",
      tags: [{ name: "playbook", value: "v0-1" }],
    })

    expect(result).toEqual({ id: "email_1" })
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: [{ name: "playbook", value: "v0-1" }],
      }),
    )
  })
})
