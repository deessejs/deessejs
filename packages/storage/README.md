# `@workspace/storage`

Generic object storage operations backed by Cloudflare R2. The package knows about objects, keys and metadata. It does not know why an object is stored or which user may access it.

## Create an R2 storage instance

Create an instance in server-side composition and provide credentials for one bucket:

```ts
import { createR2Storage } from "@workspace/storage"

const storage = createR2Storage({
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  bucket: process.env.R2_BUCKET!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
})
```

The configuration fields are all required and must be non-empty. Each instance is bound to its configured bucket. Create another instance in server-side composition to use a different bucket.

## API reference

### `createUploadUrl(input)`

Creates a presigned URL for a `PUT` request.

```ts
const uploadUrl = await storage.createUploadUrl({
  key: "objects/example.txt",
  contentType: "text/plain",
  expiresInSeconds: 300,
})
```

`key` is required and cannot be empty. `contentType` is optional. When provided, it is included in the signature, so the upload request must send the same `Content-Type` header. `expiresInSeconds` is optional, defaults to 300 seconds, and must be an integer from 1 through 604800 (7 days).

### `createDownloadUrl(input)`

Creates a presigned URL for a `GET` request.

```ts
const downloadUrl = await storage.createDownloadUrl({
  key: "objects/example.txt",
  expiresInSeconds: 600,
})
```

`key` is required and cannot be empty. `expiresInSeconds` is optional, defaults to 300 seconds, and must be an integer from 1 through 604800 (7 days).

Presigned URLs are bearer credentials. Anyone who has one can use it for its signed operation until it expires. Authorize the caller before creating a URL, and avoid logging or exposing URLs unnecessarily. Browser uploads also require an appropriate bucket CORS policy.

### `putObject(input)`

Writes an object from a Node.js readable stream, a `Uint8Array`, or a string.

```ts
import { createReadStream } from "node:fs"

await storage.putObject({
  key: "objects/example.txt",
  body: createReadStream("./example.txt"),
  contentType: "text/plain",
  contentLength: 42,
})
```

`key` and `body` are required. `contentType` and `contentLength` are optional metadata for the object. The method resolves when the provider operation completes.

### `getObject(key)`

Reads an object and returns its body stream and available metadata.

```ts
const object = await storage.getObject("objects/example.txt")

if (object.body) {
  for await (const chunk of object.body) {
    // Consume or forward each chunk.
  }
}

console.log(object.contentType, object.contentLength, object.etag)
```

The body is a Node.js readable stream and may be `undefined`. Consume or forward the stream to read the object data. Metadata fields are also optional.

### `headObject(key)`

Reads object metadata without returning its body.

```ts
const metadata = await storage.headObject("objects/example.txt")
```

The result may include `contentLength`, `contentType`, `etag`, and `lastModified`. Each field is optional because the provider may omit it.

### `copyObject(input)`

Copies an object within the instance's bucket.

```ts
await storage.copyObject({
  sourceKey: "objects/example.txt",
  destinationKey: "objects/archive/example.txt",
})
```

Both keys are required and cannot be empty. The method resolves when the provider operation completes.

### `deleteObject(key)`

Deletes an object from the instance's bucket.

```ts
await storage.deleteObject("objects/example.txt")
```

The key is required and cannot be empty. The method resolves when the provider operation completes.

## Types

The package exports the `ObjectStorage` interface and these input/result types from its root entry point:

- `R2StorageConfig`: credentials and bucket used by `createR2Storage`.
- `PresignedObjectInput` and `PresignedUploadInput`: key and optional URL expiry, with an optional content type for upload URLs.
- `PutObjectInput`: key, body, and optional content type and content length.
- `CopyObjectInput`: source and destination keys.
- `GetObjectResult`: readable body and optional object metadata.
- `StorageObjectMetadata`: optional content length, content type, ETag, and last-modified date.

## Errors and responsibilities

All operations reject with provider/SDK errors when the provider request fails. Map those errors in the application or API composition layer. The package validates that configuration values and object keys are not empty, but it does not choose key formats or validate domain-specific access rules.

The application layer is responsible for authorization, choosing object keys, deciding whether to return a presigned URL, and handling object lifecycle. Keep R2 credentials and this server-side package out of browser code.

## Commands

```bash
pnpm --filter @workspace/storage build
pnpm --filter @workspace/storage typecheck
pnpm --filter @workspace/storage lint
pnpm exec turbo run test --filter=@workspace/storage
```

## Related

- [Cloudflare R2 S3-compatible API](https://developers.cloudflare.com/r2/api/s3/)
- AWS SDK for JavaScript v3 is used as the S3-compatible client.
- Package conventions are in [AGENTS.md](AGENTS.md).
