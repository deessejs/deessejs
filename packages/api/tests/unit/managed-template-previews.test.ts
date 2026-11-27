import { beforeEach, describe, expect, it, vi } from "vitest"

const { dbSelect, signPreview } = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  signPreview: vi.fn(),
}))

vi.mock("@workspace/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/database")>()
  return { ...actual, db: { select: dbSelect } }
})
vi.mock("../../src/core/managed-releases/storage.js", () => ({
  getManagedReleaseStorage: () => ({
    sealed: { createDownloadUrl: signPreview },
  }),
}))

import { getManagedTemplateReleaseSummaries } from "../../src/core/managed-releases/template-previews.js"

function query(rows: unknown[]) {
  const result = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn().mockResolvedValue(rows),
  }
  result.from.mockReturnValue(result)
  result.where.mockReturnValue(result)
  dbSelect.mockReturnValue(result)
}

describe("managed template release summaries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signPreview.mockResolvedValue("https://r2.invalid/preview?signature=short")
  })

  it("signs the latest ready preview for five minutes", async () => {
    query([
      {
        templateId: "template-1",
        previewKey: "managed-releases/previews/template/opaque",
        createdAt: new Date("2026-11-27T10:00:00Z"),
      },
    ])

    await expect(
      getManagedTemplateReleaseSummaries(["template-1"])
    ).resolves.toEqual(
      new Map([
        [
          "template-1",
          {
            installable: true,
            previewImageUrl: "https://r2.invalid/preview?signature=short",
          },
        ],
      ])
    )
    expect(signPreview).toHaveBeenCalledWith({
      key: "managed-releases/previews/template/opaque",
      expiresInSeconds: 300,
    })
  })

  it("keeps installability without a preview and does not sign absent assets", async () => {
    query([
      {
        templateId: "template-1",
        previewKey: null,
        createdAt: new Date("2026-11-27T10:00:00Z"),
      },
    ])

    await expect(
      getManagedTemplateReleaseSummaries(["template-1"])
    ).resolves.toEqual(
      new Map([["template-1", { installable: true, previewImageUrl: null }]])
    )
    expect(signPreview).not.toHaveBeenCalled()
  })

  it("does no query when the source list has no managed templates", async () => {
    await expect(getManagedTemplateReleaseSummaries([])).resolves.toEqual(
      new Map()
    )
    expect(dbSelect).not.toHaveBeenCalled()
  })
})
