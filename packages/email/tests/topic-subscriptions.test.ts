import { beforeEach, describe, expect, it, vi } from "vitest"

import { subscribeToPlaybookUpdates } from "../src/contacts.js"

/**
 * The payload shape this suite asserts against. It mirrors the
 * Resend contacts API, where the interesting part is what is
 * absent: `audienceId`, `unsubscribed` and `properties` must all be
 * missing.
 */
type ContactPayload = {
  email: string
  topics?: { id: string; subscription: "opt_in" | "opt_out" }[]
  unsubscribed?: boolean
  audienceId?: string
  audience_id?: string
  properties?: Record<string, string | number | null>
}

type ContactResponse = {
  data: { id: string } | null
  error: { message: string } | null
}

/**
 * The Resend SDK and the server env are both mocked, so the suite
 * never touches the network and the topic id can be varied per case.
 */
const { createContact, envMock } = vi.hoisted(() => ({
  createContact: vi.fn<(p: ContactPayload) => Promise<ContactResponse>>(),
  envMock: {
    RESEND_API_KEY: "re_test_key",
    RESEND_PLAYBOOK_TOPIC_ID: "topic_abc123" as string | undefined,
  },
}))

vi.mock("resend", () => ({
  Resend: class {
    contacts = { create: createContact }
  },
}))

vi.mock("@workspace/env/server", () => ({ serverEnv: envMock }))

const payloadOf = (): ContactPayload =>
  createContact.mock.calls[0]?.[0] as ContactPayload

describe("subscribeToPlaybookUpdates", () => {
  beforeEach(() => {
    createContact.mockReset()
    envMock.RESEND_PLAYBOOK_TOPIC_ID = "topic_abc123"
    createContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    })
  })

  it("subscribes the contact to the configured topic with an opt_in", async () => {
    const result = await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    expect(result).toEqual({ ok: true })
    expect(createContact).toHaveBeenCalledTimes(1)
    expect(payloadOf()).toMatchObject({
      email: "reader@example.com",
      topics: [{ id: "topic_abc123", subscription: "opt_in" }],
    })
  })

  it("never sends an audience id alongside the topic", async () => {
    await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    // Resend rejects a payload that mixes the two, so the deprecated
    // audience overload must not survive alongside the topic.
    const payload = payloadOf()
    expect(payload).not.toHaveProperty("audienceId")
    expect(payload).not.toHaveProperty("audience_id")
    expect(payload).not.toHaveProperty("segments")
  })

  it("leaves the contact's global unsubscribed flag alone", async () => {
    await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    // The global state is separate from the per-topic subscription.
    // Forcing it back to false would re-subscribe a contact who had
    // opted out of every broadcast.
    expect(payloadOf()).not.toHaveProperty("unsubscribed")
  })

  it("sends no custom contact properties", async () => {
    await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    // Resend only accepts a value for a property that was declared in
    // the account first, and an undeclared property fails the whole
    // call. The signup handler treats that as best-effort, so the
    // symptom would be a consent checkbox reporting success while
    // recording nothing.
    expect(payloadOf()).not.toHaveProperty("properties")
  })

  it("returns not_configured and skips Resend when the topic id is missing", async () => {
    envMock.RESEND_PLAYBOOK_TOPIC_ID = undefined

    const result = await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    expect(result).toMatchObject({ ok: false, reason: "not_configured" })
    expect(result.ok).toBe(false)
    expect(createContact).not.toHaveBeenCalled()
  })

  it("returns api_error when Resend rejects the call", async () => {
    createContact.mockResolvedValue({
      data: null,
      error: { message: "topic not found" },
    })

    const result = await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    expect(result).toEqual({
      ok: false,
      reason: "api_error",
      error: "topic not found",
    })
  })

  it("returns unexpected when the SDK throws", async () => {
    createContact.mockRejectedValue(new Error("network down"))

    const result = await subscribeToPlaybookUpdates({
      email: "reader@example.com",
    })

    expect(result).toEqual({
      ok: false,
      reason: "unexpected",
      error: "network down",
    })
  })
})
