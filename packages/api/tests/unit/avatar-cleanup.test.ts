import { beforeEach, describe, expect, it, vi } from "vitest"

const harness = vi.hoisted(() => ({
  db: {} as Record<string, unknown>,
  rowsByTable: new Map<unknown, unknown[]>(),
  queuesByTable: new Map<unknown, unknown[][]>(),
  limits: [] as number[],
  deletedIds: [] as unknown[],
  updates: [] as unknown[],
  deleteObject: vi.fn(),
}))

vi.mock("@workspace/database", () => ({ db: harness.db }))
vi.mock("@workspace/database/schema", () => ({
  member: { role: "role", organizationId: "organizationId", userId: "userId" },
  organizationAvatars: { objectId: "objectId", organizationId: "organizationId" },
  storageObjects: { id: "objectId", objectKey: "objectKey", state: "state", cleanupAfter: "cleanupAfter" },
  storageUploads: { id: "uploadId", objectId: "objectId", stagedKey: "stagedKey", state: "state", cleanupAfter: "cleanupAfter" },
  userAvatars: { objectId: "objectId", userId: "userId" },
}))
vi.mock("../../src/core/avatars/storage.js", () => ({
  createAvatarKeys: vi.fn(),
  getAvatarStorage: () => ({ deleteObject: harness.deleteObject }),
}))

function queryBuilder() {
  let table: unknown
  const builder = {
    from(value: unknown) { table = value; return builder },
    where() { return builder },
    orderBy() { return builder },
    limit(value: number) { harness.limits.push(value); return builder },
    then(resolve: (value: unknown[]) => unknown) {
      const queue = harness.queuesByTable.get(table)
      const rows = queue?.length
        ? (queue.shift() ?? [])
        : harness.rowsByTable.get(table) ?? []
      return Promise.resolve(resolve(rows))
    },
  }
  return builder
}

const harnessDb = {
  select: vi.fn(() => queryBuilder()),
  delete: vi.fn(() => ({ where: vi.fn((condition: unknown) => {
    harness.deletedIds.push(condition)
    return Promise.resolve()
  }) })),
  update: vi.fn(() => ({ set: vi.fn((value: unknown) => {
    harness.updates.push(value)
    return { where: vi.fn(() => Promise.resolve()) }
  }) })),
  transaction: vi.fn(),
}

// vi.mock is hoisted, so expose the database object through the shared harness.
Object.assign(harness.db, harnessDb)

import { storageObjects, storageUploads } from "@workspace/database/schema"
import { cleanupAvatars } from "../../src/core/avatars/lifecycle.js"

describe("cleanupAvatars", () => {
  beforeEach(() => {
    harness.rowsByTable.clear()
    harness.queuesByTable.clear()
    harness.limits.length = 0
    harness.deletedIds.length = 0
    harness.updates.length = 0
    harness.deleteObject.mockReset().mockResolvedValue(undefined)
    harness.db.delete.mockImplementation(() => ({ where: vi.fn(() => Promise.resolve()) }))
  })

  it("drains a backlog in bounded batches and leaves later work for the next invocation", async () => {
    const rows = Array.from({ length: 250 }, (_, index) => ({
      id: `upload-${index}`, objectId: `object-${index}`, stagedKey: `stage-${index}`, state: "delete_pending",
    }))
    harness.queuesByTable.set(storageUploads, [rows.slice(0, 100), rows.slice(100, 200), rows.slice(200)])
    harness.rowsByTable.set(storageObjects, [])
    harness.deleteObject.mockResolvedValue(undefined)

    await cleanupAvatars()
    expect(harness.limits.filter((limit) => limit === 100)).toHaveLength(4)
    expect(harness.deleteObject).toHaveBeenCalledTimes(250)
  })

  it("continues after an object deletion fails and keeps that row available for retry", async () => {
    harness.rowsByTable.set(storageUploads, [])
    harness.rowsByTable.set(storageObjects, [
      { id: "failed", objectKey: "key-failed" },
      { id: "succeeded", objectKey: "key-succeeded" },
    ])
    harness.queuesByTable.set(storageObjects, [
      [{ id: "failed" }, { id: "succeeded" }],
      [{ id: "failed", objectKey: "key-failed" }],
      [{ id: "succeeded", objectKey: "key-succeeded" }],
    ])
    harness.deleteObject.mockImplementation(async (key: string) => {
      if (key === "key-failed") throw new Error("storage unavailable")
    })

    await cleanupAvatars()
    expect(harness.deleteObject).toHaveBeenCalledTimes(2)
    await cleanupAvatars()
    expect(harness.deleteObject.mock.calls.filter(([key]) => key === "key-failed").length).toBeGreaterThanOrEqual(2)
  })

  it("caps each cleanup category at ten batches per invocation", async () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({
      id: `upload-${index}`, objectId: `object-${index}`, stagedKey: `stage-${index}`, state: "delete_pending",
    }))
    harness.queuesByTable.set(storageUploads, Array.from({ length: 10 }, () => rows))
    harness.queuesByTable.set(storageObjects, Array.from({ length: 10 }, () => []))
    harness.deleteObject.mockResolvedValue(undefined)

    await cleanupAvatars()
    expect(harness.limits.filter((limit) => limit === 100)).toHaveLength(11)
    expect(harness.deleteObject).toHaveBeenCalledTimes(1000)
  })
})
