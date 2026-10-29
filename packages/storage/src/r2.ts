import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { NodeJsClient } from "@smithy/types"
import { createObjectOperations } from "./object-operations.js"
import type { ObjectStorage } from "./storage.js"

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
    ...createObjectOperations(client, config.bucket),

    async createDownloadUrl({ expiresInSeconds, key }) {
      assertNonEmpty(key, "Object key")
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: resolveExpiry(expiresInSeconds) },
      )
    },

    async createUploadUrl({ contentType, expiresInSeconds, key }) {
      assertNonEmpty(key, "Object key")
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          ContentType: contentType,
          Key: key,
        }),
        {
          expiresIn: resolveExpiry(expiresInSeconds),
          ...(contentType === undefined
            ? {}
            : { signableHeaders: new Set(["content-type"]) }),
        },
      )
    },
  }
}
