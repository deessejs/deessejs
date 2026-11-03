import type { Readable } from "node:stream"

export interface StorageObjectMetadata {
  contentLength?: number
  contentType?: string
  etag?: string
  lastModified?: Date
}

export interface GetObjectResult extends StorageObjectMetadata {
  body: Readable | undefined
}

export interface PutObjectInput {
  body: Readable | Uint8Array | string
  contentLength?: number
  contentType?: string
  key: string
}

export interface PresignedObjectInput {
  expiresInSeconds?: number
  key: string
}

export interface PresignedUploadInput extends PresignedObjectInput {
  contentType?: string
}

export interface CopyObjectInput {
  destinationKey: string
  sourceKey: string
}

export interface ObjectStorage {
  copyObject(input: CopyObjectInput): Promise<void>
  createDownloadUrl(input: PresignedObjectInput): Promise<string>
  createUploadUrl(input: PresignedUploadInput): Promise<string>
  deleteObject(key: string): Promise<void>
  getObject(key: string): Promise<GetObjectResult>
  headObject(key: string): Promise<StorageObjectMetadata>
  putObject(input: PutObjectInput): Promise<void>
}
