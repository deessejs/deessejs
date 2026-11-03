import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3"
import { Readable } from "node:stream"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createObjectOperations } from "../src/object-operations.js"

const BUCKET = "private-fixtures"

type ObjectCommand =
  | CopyObjectCommand
  | DeleteObjectCommand
  | GetObjectCommand
  | HeadObjectCommand
  | PutObjectCommand

describe("createObjectOperations", () => {
  let commands: ObjectCommand[]
  let send: ReturnType<typeof vi.fn>
  let response: Record<string, unknown>
  let storage: ReturnType<typeof createObjectOperations>

  beforeEach(() => {
    commands = []
    response = {}
    send = vi.fn(async (command: ObjectCommand) => {
      commands.push(command)
      return response
    })
    storage = createObjectOperations(
      { send } as unknown as Pick<S3Client, "send">,
      BUCKET,
    )
  })

  it("writes a stream with its object metadata", async () => {
    const body = Readable.from(["fixture bytes"])

    await storage.putObject({
      body,
      contentLength: 13,
      contentType: "application/octet-stream",
      key: "uploads/archive.bin",
    })

    const command = commands[0]
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect((command as PutObjectCommand).input).toMatchObject({
      Body: body,
      Bucket: BUCKET,
      ContentLength: 13,
      ContentType: "application/octet-stream",
      Key: "uploads/archive.bin",
    })
  })

  it("returns the read stream and available metadata", async () => {
    const body = Readable.from(["fixture bytes"])
    const lastModified = new Date("2026-10-30T00:00:00.000Z")
    response = {
      Body: body,
      ContentLength: 13,
      ContentType: "application/octet-stream",
      ETag: '"fixture-etag"',
      LastModified: lastModified,
    }

    const result = await storage.getObject("uploads/archive.bin")

    expect(commands[0]).toBeInstanceOf(GetObjectCommand)
    expect((commands[0] as GetObjectCommand).input).toEqual({
      Bucket: BUCKET,
      Key: "uploads/archive.bin",
    })
    expect(result).toEqual({
      body,
      contentLength: 13,
      contentType: "application/octet-stream",
      etag: '"fixture-etag"',
      lastModified,
    })
  })

  it("omits metadata fields the provider did not return", async () => {
    const metadata = await storage.headObject("uploads/archive.bin")

    expect(commands[0]).toBeInstanceOf(HeadObjectCommand)
    expect(metadata).toEqual({})
  })

  it("copies objects with encoded source key segments", async () => {
    await storage.copyObject({
      destinationKey: "sealed/archive.zip",
      sourceKey: "staging/a b/emoji-💜?#.zip",
    })

    expect(commands[0]).toBeInstanceOf(CopyObjectCommand)
    expect((commands[0] as CopyObjectCommand).input).toEqual({
      Bucket: BUCKET,
      CopySource:
        "private-fixtures/staging/a%20b/emoji-%F0%9F%92%9C%3F%23.zip",
      Key: "sealed/archive.zip",
    })
  })

  it("deletes the requested key", async () => {
    await storage.deleteObject("uploads/old.bin")

    expect(commands[0]).toBeInstanceOf(DeleteObjectCommand)
    expect((commands[0] as DeleteObjectCommand).input).toEqual({
      Bucket: BUCKET,
      Key: "uploads/old.bin",
    })
  })

  it("rejects empty keys before calling the provider", async () => {
    await expect(storage.headObject("")).rejects.toThrow(
      "Object key must not be empty",
    )
    await expect(
      storage.copyObject({ destinationKey: "destination", sourceKey: "" }),
    ).rejects.toThrow("Object key must not be empty")
    expect(send).not.toHaveBeenCalled()
  })

  it("propagates provider errors without wrapping them", async () => {
    const providerError = new Error("R2 unavailable")
    send.mockRejectedValue(providerError)

    await expect(storage.deleteObject("uploads/old.bin")).rejects.toBe(
      providerError,
    )
  })
})
