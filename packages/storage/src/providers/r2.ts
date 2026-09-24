/**
 * Cloudflare R2 implementation of {@link ObjectStore}.
 *
 * R2 exposes an S3-compatible API at:
 *   https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
 *
 * Each request is signed with AWS SigV4 (region = "auto", service =
 * "s3"). The signer lives at `../internal/sigv4.ts` and is exercised
 * against the canonical AWS test vectors in `tests/sigv4.test.ts`.
 *
 * Endpoints we hit:
 *   PUT  /<bucket>/<key>             put
 *   GET  /<bucket>/<key>             get
 *   HEAD /<bucket>/<key>             head
 *   DELETE /<bucket>/<key>           delete
 *   GET  /<bucket>?list-type=2...    list (paginated)
 *
 * Errors: see the four storage error classes in `../errors.ts`.
 * R2 returns 404 (NoSuchKey), 403 (AccessDenied, signature mismatch),
 * 5xx (server faults). We translate these to the typed hierarchy.
 *
 * Auth: the credentials come from environment or constructor input.
 * Region is fixed to "auto" per Cloudflare's R2 spec (region is
 * implicit). Service is "s3".
 *
 * NO real-network tests in this commit. Provider tests mock the
 * `fetchImpl` seam and verify the request shape, signing, and
 * error mapping. A live R2 round-trip test belongs to a follow-up
 * PR gated on a real R2 account (and CI secret).
 */

import { Readable } from "node:stream"

import {
  signRequest,
  type SigV4Credentials,
} from "../internal/sigv4.js"
import {
  StorageAuthError,
  StorageError,
  StorageNetworkError,
  StorageNotFoundError,
} from "../errors.js"
import type {
  ObjectBody,
  ObjectKey,
  ObjectMeta,
  ObjectStore,
} from "../object-store.js"

export interface R2Options {
  /** Cloudflare account ID (numeric). */
  accountId: string
  /** R2 bucket name. */
  bucket: string
  /**
   * Credentials. Pre-read from environment or secret manager by the
   * caller; we do not touch process.env directly (testable +
   * portable across Workers).
   */
  credentials: SigV4Credentials
  /**
   * Optional fetch override. Tests inject a mocked fetch here;
   * production uses the global `fetch`.
   */
  fetchImpl?: typeof fetch
}

/**
 * Default SigV4 region for Cloudflare R2. R2 is region-agnostic;
 * Cloudflare accepts the literal string "auto" and routes to the
 * nearest physical region.
 *
 * `service` is always "s3".
 */
const R2_REGION = "auto"
const R2_SERVICE = "s3"

export class R2ObjectStore implements ObjectStore {
  private readonly baseUrl: string
  private readonly credentials: SigV4Credentials
  private readonly fetchImpl: typeof fetch
  private readonly bucket: string

  constructor(options: R2Options) {
    if (!options.accountId) {
      throw new Error("R2ObjectStore requires accountId")
    }
    if (!options.bucket) {
      throw new Error("R2ObjectStore requires bucket")
    }
    if (!options.credentials.accessKeyId || !options.credentials.secretAccessKey) {
      throw new Error("R2ObjectStore requires accessKeyId and secretAccessKey")
    }
    this.credentials = {
      region: options.credentials.region ?? R2_REGION,
      service: options.credentials.service ?? R2_SERVICE,
      accessKeyId: options.credentials.accessKeyId,
      secretAccessKey: options.credentials.secretAccessKey,
    }
    this.bucket = options.bucket
    this.fetchImpl = options.fetchImpl ?? fetch
    this.baseUrl = `https://${options.accountId}.r2.cloudflarestorage.com`
  }

  /** Build a fully-signed URL for the given key + method. */
  private async signedRequest(
    key: ObjectKey,
    options: {
      method: "PUT" | "GET" | "HEAD" | "DELETE"
      /** Extra signed headers to include in canonical request. */
      additionalSignedHeaders?: Record<string, string>
      /** Body or null for bodyless requests. */
      body?: Uint8Array | null
    },
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const url = `${this.baseUrl}/${this.bucket}/${encodeURIComponent(key)}`
    const host = new URL(url).host
    // Build the canonical request's headers. The signer also
    // requires `host` (it injects it if absent), but we set it
    // here explicitly so the signed headers list AND the
    // outgoing fetch call agree.
    const headers: Array<{ name: string; value: string }> = [
      { name: "host", value: host },
    ]
    if (options.additionalSignedHeaders) {
      for (const [name, value] of Object.entries(options.additionalSignedHeaders)) {
        headers.push({ name, value })
      }
    }
    const payload = options.body ?? ""
    const auth = await signRequest(
      {
        method: options.method,
        url,
        headers,
        payload,
        now: Date.now(),
      },
      {
        credentials: this.credentials,
        additionalHeaders: Object.keys(options.additionalSignedHeaders ?? {}),
      },
    )
    // Outgoing headers: the Authorization line, x-amz-date, all
    // signed headers (host + any additional). The fetch layer
    // needs every signed header to be present, otherwise the
    // server's canonical request does not match the one we signed.
    const signedHeaderNames = new Set(
      auth.authorization
        .match(/SignedHeaders=([^\s,]+)/)?.[1]
        ?.split(";") ?? [],
    )
    const result: Record<string, string> = {
      Authorization: auth.authorization,
      "X-Amz-Date": auth.amzDate,
    }
    for (const [name, value] of Object.entries(options.additionalSignedHeaders ?? {})) {
      result[name] = value
    }
    result["host"] = host
    return { url, headers: result }
  }

  /**
   * Translate a fetch response into a typed storage error.
   * Returns true if the response should be retried as 404, false
   * if it was an error. Throws on any non-2xx.
   */
  private async interpretResponse(
    response: Response,
    context: { key: ObjectKey; method: string },
    expectedOk: () => boolean,
  ): Promise<{ ok: true } | { ok: false; notFound: true }> {
    if (response.status === 404) {
      // R2: NoSuchKey surfaces as 404 on GET/HEAD.
      return { ok: false, notFound: true }
    }
    if (response.status === 401 || response.status === 403) {
      // 401 = credentials missing or invalid. 403 = signed request
      // rejected (signature mismatch, clock skew outside the
      // tolerance, etc.). Both surface to the consumer as auth.
      const body = await response.text().catch(() => "<body unread>")
      throw new StorageAuthError(
        `R2 returned ${response.status} on ${context.method} ${context.key}: ${body.slice(0, 200)}`,
        { key: context.key },
      )
    }
    if (response.status >= 500) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on ${context.method} ${context.key}`,
        { key: context.key },
      )
    }
    if (!response.ok && !expectedOk()) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on ${context.method} ${context.key}`,
        { key: context.key },
      )
    }
    return { ok: true }
  }

  async put(key: ObjectKey, body: Uint8Array | ObjectBody): Promise<void> {
    // We support both body shapes. For getBytes, we buffer — R2
    // accepts PUT with body, and OpenStream is more nuanced.
    let bytes: Uint8Array
    if (body instanceof Uint8Array) {
      bytes = body
    } else {
      const reader = body.getReader()
      const chunks: Uint8Array[] = []
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      const total = chunks.reduce((s, c) => s + c.length, 0)
      bytes = new Uint8Array(total)
      let offset = 0
      for (const c of chunks) {
        bytes.set(c, offset)
        offset += c.length
      }
    }

    // Compute payload hash for the signed request. R2 verifies the
    // hash on PUT; an incorrect hash produces a SignatureDoesNotMatch.
    const payloadHash = await crypto.subtle
      .digest("SHA-256", bytes)
      .then((d) =>
        Array.from(new Uint8Array(d))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      )

    const { url, headers } = await this.signedRequest(key, {
      method: "PUT",
      body: bytes,
      additionalSignedHeaders: {
        "content-type": "application/octet-stream",
        "x-amz-content-sha256": payloadHash,
      },
    })

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: "PUT",
        headers: {
          ...headers,
          "content-type": "application/octet-stream",
          "x-amz-content-sha256": payloadHash,
        },
        body: bytes,
      })
    } catch (cause) {
      throw new StorageNetworkError(
        `Network failure on PUT ${key}`,
        { key },
        { cause },
      )
    }

    await this.interpretResponse(
      response,
      { key, method: "PUT" },
      () => response.status === 200 || response.status === 204,
    )
  }

  async get(key: ObjectKey): Promise<ObjectBody | null> {
    const { url, headers } = await this.signedRequest(key, {
      method: "GET",
    })

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers,
      })
    } catch (cause) {
      throw new StorageNetworkError(
        `Network failure on GET ${key}`,
        { key },
        { cause },
      )
    }

    if (response.status === 404) {
      return null
    }
    if (response.status >= 500) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on GET ${key}`,
        { key },
      )
    }
    if (response.status === 401 || response.status === 403) {
      const body = await response.text().catch(() => "")
      throw new StorageAuthError(
        `R2 returned ${response.status} on GET ${key}: ${body.slice(0, 200)}`,
        { key },
      )
    }
    if (!response.ok) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on GET ${key}`,
        { key },
      )
    }

    if (!response.body) {
      throw new StorageError(
        "storage.empty_body",
        `Empty body on GET ${key}`,
        { key },
      )
    }

    // Wrap the Web ReadableStream in a Node Readable for use by
    // Node-side consumers (if any), then hand off as-is to the
    // browser-side shape.
    return response.body
  }

  async delete(key: ObjectKey): Promise<void> {
    const { url, headers } = await this.signedRequest(key, {
      method: "DELETE",
    })

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: "DELETE",
        headers,
      })
    } catch (cause) {
      throw new StorageNetworkError(
        `Network failure on DELETE ${key}`,
        { key },
        { cause },
      )
    }

    // 404 on DELETE is treated as success (idempotent delete).
    if (response.status === 404) return
    if (response.status === 401 || response.status === 403) {
      const body = await response.text().catch(() => "")
      throw new StorageAuthError(
        `R2 returned ${response.status} on DELETE ${key}: ${body.slice(0, 200)}`,
        { key },
      )
    }
    if (response.status >= 500) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on DELETE ${key}`,
        { key },
      )
    }
    // 200/204 are success. Anything else (3xx redirect, 4xx other
    // than 401/403/404) is a server-protocol anomaly.
    if (!response.ok) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on DELETE ${key}`,
        { key },
      )
    }
  }

  async head(key: ObjectKey): Promise<ObjectMeta | null> {
    const { url, headers: requestHeaders } = await this.signedRequest(key, {
      method: "HEAD",
    })

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: "HEAD",
        headers: requestHeaders,
      })
    } catch (cause) {
      throw new StorageNetworkError(
        `Network failure on HEAD ${key}`,
        { key },
        { cause },
      )
    }

    if (response.status === 404) return null
    if (response.status === 401 || response.status === 403) {
      throw new StorageAuthError(
        `R2 returned ${response.status} on HEAD ${key}`,
        { key },
      )
    }
    if (response.status >= 500) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on HEAD ${key}`,
        { key },
      )
    }
    if (!response.ok) {
      throw new StorageNetworkError(
        `R2 returned ${response.status} on HEAD ${key}`,
        { key },
      )
    }

    const etag = response.headers.get("etag")
    const size = response.headers.get("content-length")
    const lastModified = response.headers.get("last-modified")
    const contentType = response.headers.get("content-type")

    const rawHeaders = new Map<string, string>()
    response.headers.forEach((v, k) => {
      rawHeaders.set(k.toLowerCase(), v)
    })

    return {
      key,
      ...(etag !== null && etag !== undefined ? { etag } : {}),
      ...(size !== null ? { size: Number(size) } : {}),
      ...(lastModified ? { lastModified } : {}),
      ...(contentType ? { contentType } : {}),
      rawHeaders,
    }
  }

  async *list(prefix?: ObjectKey): AsyncIterable<ObjectMeta> {
    let continuationToken: string | undefined
    do {
      const params = new URLSearchParams({
        "list-type": "2",
        bucket: this.bucket,
      })
      if (prefix) params.set("prefix", prefix)
      if (continuationToken) params.set("continuation-token", continuationToken)

      const listUrl = `${this.baseUrl}/${this.bucket}?${params.toString()}`

      // We cannot use signedRequest() here because the host URL
      // carries the query string; instead we sign the canonical list
      // URL directly. The signer sees the URL with its query string
      // and SigV4 canonicalisation covers queries.
      const auth = await signRequest(
        {
          method: "GET",
          url: listUrl,
          headers: [
            { name: "host", value: new URL(listUrl).host },
          ],
          payload: "",
          now: Date.now(),
        },
        { credentials: this.credentials },
      )

      const listCtx = { key: prefix ?? "(root)" }

      let response: Response
      try {
        response = await this.fetchImpl(listUrl, {
          method: "GET",
          headers: { Authorization: auth.authorization, "X-Amz-Date": auth.amzDate },
        })
      } catch (cause) {
        throw new StorageNetworkError(
          `Network failure on LIST ${prefix ?? ""}`,
          listCtx,
          { cause },
        )
      }

      if (response.status === 401 || response.status === 403) {
        throw new StorageAuthError(
          `R2 returned ${response.status} on LIST`,
          listCtx,
        )
      }
      if (response.status >= 500) {
        throw new StorageNetworkError(
          `R2 returned ${response.status} on LIST`,
          listCtx,
        )
      }
      if (!response.ok) {
        throw new StorageNetworkError(
          `R2 returned ${response.status} on LIST`,
          listCtx,
        )
      }

      const xml = await response.text()
      // Minimal XML parsing: extract <Key>, <Size>, <LastModified>,
      // <ETag> from each <Contents>. We avoid a hard dep on an XML
      // parser (R2's response is small) by string-scanning.
      const items = xml.match(
        /<Contents>[\s\S]*?<\/Contents>/g,
      ) ?? []
      for (const item of items) {
        const keyMatch = /<Key>([^<]+)<\/Key>/.exec(item)
        const sizeMatch = /<Size>(\d+)<\/Size>/.exec(item)
        const lmMatch = /<LastModified>([^<]+)<\/LastModified>/.exec(item)
        const etagMatch = /<ETag>([^<]+)<\/ETag>/.exec(item)
        if (keyMatch && keyMatch[1] !== undefined) {
          yield {
            key: keyMatch[1],
            ...(sizeMatch && sizeMatch[1] !== undefined
              ? { size: Number(sizeMatch[1]) }
              : {}),
            ...(lmMatch && lmMatch[1] !== undefined
              ? { lastModified: lmMatch[1] }
              : {}),
            ...(etagMatch && etagMatch[1] !== undefined
              ? { etag: etagMatch[1].replace(/"/g, "") }
              : {}),
          }
        }
      }

      const nextContinuation = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)
      continuationToken = nextContinuation ? nextContinuation[1] : undefined
    } while (continuationToken)
  }
}
