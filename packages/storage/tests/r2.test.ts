import { describe, expect, it } from "vitest"
import { createR2Storage, type R2StorageConfig } from "../src/r2.js"

const CONFIG: R2StorageConfig = {
  accountId: "1234567890abcdef1234567890abcdef",
  accessKeyId: "test-access-key",
  bucket: "private-fixtures",
  secretAccessKey: "test-secret-key-that-must-not-leak",
}

describe("createR2Storage", () => {
  it("creates a presigned upload URL with the expected object and expiry", async () => {
    const storage = createR2Storage(CONFIG)

    const url = new URL(
      await storage.createUploadUrl({
        contentType: "image/png",
        key: "profile-images/user-1.png",
      }),
    )

    expect(url.hostname).toBe(
      `private-fixtures.${CONFIG.accountId}.r2.cloudflarestorage.com`,
    )
    expect(url.pathname).toBe("/profile-images/user-1.png")
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300")
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
      "content-type",
    )
    expect(url.search).not.toContain(CONFIG.secretAccessKey)
  })

  it("creates a presigned download URL for the requested duration", async () => {
    const storage = createR2Storage(CONFIG)

    const url = new URL(
      await storage.createDownloadUrl({
        expiresInSeconds: 90,
        key: "sealed/release.zip",
      }),
    )

    expect(url.pathname).toBe("/sealed/release.zip")
    expect(url.searchParams.get("X-Amz-Expires")).toBe("90")
  })

  it.each([1, 604_800])(
    "accepts the R2 expiry boundary of %i seconds",
    async (expiresInSeconds) => {
      const storage = createR2Storage(CONFIG)
      const url = new URL(
        await storage.createDownloadUrl({
          expiresInSeconds,
          key: "sealed/release.zip",
        }),
      )

      expect(url.searchParams.get("X-Amz-Expires")).toBe(
        String(expiresInSeconds),
      )
    },
  )

  it.each([0, 604_801, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid URL expiry %s before signing",
    async (expiresInSeconds) => {
      const storage = createR2Storage(CONFIG)

      await expect(
        storage.createDownloadUrl({ expiresInSeconds, key: "sealed/file" }),
      ).rejects.toThrow(RangeError)
    },
  )

  it.each([
    ["accountId", ""],
    ["accessKeyId", ""],
    ["bucket", ""],
    ["secretAccessKey", ""],
  ] as const)("rejects an empty %s", (field, value) => {
    expect(() => createR2Storage({ ...CONFIG, [field]: value })).toThrow(
      TypeError,
    )
  })

  it("rejects an empty object key before signing", async () => {
    const storage = createR2Storage(CONFIG)

    await expect(storage.createUploadUrl({ key: "" })).rejects.toThrow(
      "Object key must not be empty",
    )
  })
})
