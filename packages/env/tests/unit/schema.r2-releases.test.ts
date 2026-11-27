import { describe, expect, it } from "vitest"
import { serverSchema } from "../../src/schema.js"

const buckets = { NODE_ENV: "test", R2_TEMPLATE_RELEASES_BUCKET: "sealed", R2_TEMPLATE_RELEASES_STAGING_BUCKET: "staging" }
const credentials = { R2_ACCOUNT_ID: "account", R2_ACCESS_KEY_ID: "key", R2_SECRET_ACCESS_KEY: "secret" }

describe("managed release R2 environment", () => {
  it("requires both distinct buckets and shared R2 credentials when configured", () => {
    expect(serverSchema.safeParse({ ...buckets, ...credentials }).success).toBe(true)
    expect(serverSchema.safeParse({ ...buckets, ...credentials, R2_TEMPLATE_RELEASES_STAGING_BUCKET: "sealed" }).success).toBe(false)
    expect(serverSchema.safeParse({ ...buckets }).success).toBe(false)
    expect(serverSchema.safeParse({ ...buckets, ...credentials, R2_TEMPLATE_RELEASES_BUCKET: undefined }).success).toBe(false)
  })

  it("allows release storage to share account credentials without requiring the avatar bucket", () => {
    expect(serverSchema.safeParse({ ...buckets, ...credentials }).success).toBe(true)
  })
})
