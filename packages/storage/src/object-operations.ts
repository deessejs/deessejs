import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3"
import type { IncomingMessage } from "node:http"
import type { ObjectStorage, StorageObjectMetadata } from "./storage.js"

type ObjectOperations = Pick<
  ObjectStorage,
  "copyObject" | "deleteObject" | "getObject" | "headObject" | "putObject"
>

function assertKey(key: string): void {
  if (key.length === 0) {
    throw new TypeError("Object key must not be empty")
  }
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

export function createObjectOperations(
  client: Pick<S3Client, "send">,
  bucket: string,
): ObjectOperations {
  return {
    async copyObject({ destinationKey, sourceKey }) {
      assertKey(sourceKey)
      assertKey(destinationKey)
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: encodeCopySource(bucket, sourceKey),
          Key: destinationKey,
        }),
      )
    },

    async deleteObject(key) {
      assertKey(key)
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    },

    async getObject(key) {
      assertKey(key)
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      )
      return {
        body: response.Body as IncomingMessage | undefined,
        ...toMetadata(response),
      }
    },

    async headObject(key) {
      assertKey(key)
      const response = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      )
      return toMetadata(response)
    },

    async putObject({ body, contentLength, contentType, key }) {
      assertKey(key)
      await client.send(
        new PutObjectCommand({
          Body: body,
          Bucket: bucket,
          ContentLength: contentLength,
          ContentType: contentType,
          Key: key,
        }),
      )
    },
  }
}
