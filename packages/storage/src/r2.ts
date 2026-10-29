import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { NodeJsClient } from "@smithy/types"
import type { IncomingMessage } from "node:http"
import type { ObjectStorage, StorageObjectMetadata } from "./storage.js"

const MAX_PRESIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60
const DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 5 * 60

export interface R2StorageConfig {
  accountId: string
  accessKeyId: string
  bucket: string
  secretAccessKey: string
}

function assertNonEmpty(value: string, name: string): void {
  if (value.length === 0) {
    throw new TypeError(`${name} must not be empty`)
  }
}

function assertKey(key: string): void {
  assertNonEmpty(key, "Object key")
}

function resolveExpiry(expiresInSeconds: number | undefined): number {
  const expiry = expiresInSeconds ?? DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS
  if (
    !Number.isInteger(expiry) ||
    expiry < 1 ||
    expiry > MAX_PRESIGNED_URL_EXPIRY_SECONDS
  ) {
    throw new RangeError(
      `Presigned URL expiry must be an integer between 1 and ${MAX_PRESIGNED_URL_EXPIRY_SECONDS} seconds`,
    )
  }
  return expiry
}

function encodeCopySource(bucket: string, key: string): string {
  return `${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`
}

function toMetadata(response: {
  ContentLength?: number | undefined
  ContentType?: string | undefined
  ETag?: string | undefined
  LastModified?: Date | undefined
}): StorageObjectMetadata {
  return {
    ...(response.ContentLength === undefined
      ? {}
      : { contentLength: response.ContentLength }),
    ...(response.ContentType === undefined
      ? {}
      : { contentType: response.ContentType }),
    ...(response.ETag === undefined ? {} : { etag: response.ETag }),
    ...(response.LastModified === undefined
      ? {}
      : { lastModified: response.LastModified }),
  }
}

export function createR2Storage(config: R2StorageConfig): ObjectStorage {
  assertNonEmpty(config.accountId, "R2 account ID")
  assertNonEmpty(config.accessKeyId, "R2 access key ID")
  assertNonEmpty(config.bucket, "R2 bucket")
  assertNonEmpty(config.secretAccessKey, "R2 secret access key")

  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  }) as NodeJsClient<S3Client>

  return {
    async copyObject({ destinationKey, sourceKey }) {
      assertKey(sourceKey)
      assertKey(destinationKey)
      await client.send(
        new CopyObjectCommand({
          Bucket: config.bucket,
          CopySource: encodeCopySource(config.bucket, sourceKey),
          Key: destinationKey,
        }),
      )
    },

    async createDownloadUrl({ expiresInSeconds, key }) {
      assertKey(key)
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: resolveExpiry(expiresInSeconds) },
      )
    },

    async createUploadUrl({ contentType, expiresInSeconds, key }) {
      assertKey(key)
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          ContentType: contentType,
          Key: key,
        }),
        { expiresIn: resolveExpiry(expiresInSeconds) },
      )
    },

    async deleteObject(key) {
      assertKey(key)
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
      )
    },

    async getObject(key) {
      assertKey(key)
      const response = await client.send(
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      )
      return {
        body: response.Body as IncomingMessage | undefined,
        ...toMetadata(response),
      }
    },

    async headObject(key) {
      assertKey(key)
      const response = await client.send(
        new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
      )
      return toMetadata(response)
    },

    async putObject({ body, contentLength, contentType, key }) {
      assertKey(key)
      await client.send(
        new PutObjectCommand({
          Body: body,
          Bucket: config.bucket,
          ContentLength: contentLength,
          ContentType: contentType,
          Key: key,
        }),
      )
    },
  }
}
