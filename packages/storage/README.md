# `@workspace/storage`

Generic object storage operations backed by Cloudflare R2. The package knows about objects, keys and metadata. It does not know why an object is stored or which user may access it.

## Usage

Create one storage instance for a bucket in server-side composition:

```ts
import { createR2Storage } from "@workspace/storage"

const storage = createR2Storage({
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  bucket: process.env.R2_BUCKET!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
})

const uploadUrl = await storage.createUploadUrl({
  key: "objects/example.txt",
  contentType: "text/plain",
})
```

The application layer is responsible for authorizing a request, choosing its object key and deciding whether to return a presigned URL. Presigned URLs are bearer credentials and should be treated as secrets. Browser uploads also require an appropriate bucket CORS policy.

## Operations

- Presigned upload and download URLs
- Read and write object streams or byte values
- Read object metadata
- Copy and delete objects

The bucket is fixed when the storage instance is created. Create separate instances in server-side composition when different buckets are needed. SDK errors propagate to the caller.

## Commands

```bash
pnpm build
pnpm typecheck
pnpm lint
```

## Related

- Uses the [Cloudflare R2 S3-compatible API](https://developers.cloudflare.com/r2/api/s3/).
- Uses AWS SDK for JavaScript v3 as the S3-compatible client.
- Package conventions are in [AGENTS.md](AGENTS.md).
