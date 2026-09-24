/**
 * AWS Signature V4 signer.
 *
 * Pure cryptography, no transport. Takes a request shape (method, URL,
 * headers, payload) and a credential triple (accessKeyId, secretAccessKey,
 * region, service), and produces the canonical Authorization header.
 *
 * Verified against the 12 official AWS SigV4 test vectors. See
 * `tests/sigv4.test.ts` for the fixtures and the canonical strings.
 *
 * Implementation uses only `globalThis.crypto.subtle`, so the same code
 * runs unmodified in Node 20+, Cloudflare Workers, Deno, Bun, and modern
 * browsers. No `node:crypto`, no `Buffer`, no `TextEncoder`-only paths.
 *
 * The signer is intentionally direct (no helpers, no abstractions)
 * because every line here maps to a published AWS specification step.
 * If you find yourself "tidying up" this file, you're probably hiding
 * a bug. The reference is the AWS SigV4 spec; this file mirrors it.
 */

const ALGORITHM = "AWS4-HMAC-SHA256" as const
const SIGNED_HEADERS_REQUIRED = ["host"] as const

/** A canonical header entry used in the signed-headers list. */
interface HeaderEntry {
  name: string
  value: string
}

/**
 * The full credential triple.
 *
 * `region` is `"auto"` for Cloudflare R2. The service is `"s3"`.
 */
export interface SigV4Credentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  service: string
}

/**
 * The request shape the signer consumes.
 *
 * `headers` is an array (not a `Record`) so duplicate header names
 * preserve client-controlled order — the canonical request must
 * list them in lexicographic order of the lowercased name, but the
 * INPUT order is irrelevant for correctness.
 */
export interface SigV4Request {
  method: string
  /** Full URL including query string. `https` is the only supported scheme. */
  url: string
  headers: HeaderEntry[]
  /** Body bytes or `""` for `x-amz-content-sha256` of empty payload. */
  payload: Uint8Array | string
  /** Current time in milliseconds since epoch. */
  now: number
}

/** Output: the Authorization header value AND the parsed components. */
export interface SigV4Authorization {
  /** The full Authorization header line, e.g. `AWS4-HMAC-SHA256 ...`. */
  authorization: string
  /** Date-time used for signing (`YYYYMMDDTHHmmssZ`). */
  amzDate: string
  /** Date-stamp used for credential scope (`YYYYMMDD`). */
  dateStamp: string
}

// ---------------------------------------------------------------------------
// Primitive crypto: SHA-256 and HMAC-SHA-256.
// ---------------------------------------------------------------------------

/**
 * SHA-256 of a string-or-bytes input, returned as a lowercase hex string
 * with no whitespace.
 */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes)
  return bufferToHex(digest)
}

/**
 * HMAC-SHA-256 with a binary key. Returns the raw 32-byte MAC.
 */
export async function hmacSha256Raw(
  key: Uint8Array,
  message: string,
): Promise<Uint8Array> {
  // SubtleCrypto requires the key be imported as a CryptoKey. The
  // `extractable: false` flag prevents accidental key leakage through
  // back-channel exports.
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await globalThis.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  )
  return new Uint8Array(sig)
}

/**
 * HMAC-SHA-256 with a binary key, returned as lowercase hex.
 */
export async function hmacSha256Hex(
  key: Uint8Array,
  message: string,
): Promise<string> {
  const raw = await hmacSha256Raw(key, message)
  return bufferToHex(raw)
}

// ---------------------------------------------------------------------------
// Key derivation.
//
// AWS signs by deriving a 4-component key: kDate, kRegion, kService,
// kSigning. Each is HMAC-SHA-256 of the previous with a fixed label.
// ---------------------------------------------------------------------------

/**
 * Derive the signing key for a (region, service, date) tuple.
 *
 * The derived key is the bit the caller stores across multiple signed
 * requests on the same date (so signing 100 requests on the same day
 * is 400 HMACs total, not 700).
 */
export async function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<Uint8Array> {
  const kSecret = new TextEncoder().encode(`AWS4${secretAccessKey}`)
  const kDate = await hmacSha256Raw(kSecret, dateStamp)
  const kRegion = await hmacSha256Raw(kDate, region)
  const kService = await hmacSha256Raw(kRegion, service)
  const kSigning = await hmacSha256Raw(kService, "aws4_request")
  return kSigning
}

// ---------------------------------------------------------------------------
// Canonical request and string-to-sign.
//
// The canonicalization is the load-bearing part. Get the canonical
// request wrong and no signature is valid. Test fixtures must lock
// each step's output.
// ---------------------------------------------------------------------------

/**
 * The five steps that build the canonical request, in order. Public so
 * tests can assert against each step's intermediate output.
 *
 *  1. Lowercase + sort header names lexicographically.
 *  2. Trim leading/trailing whitespace from each value, fold internal
 *     whitespace runs to a single space.
 *  3. URI-encode path (single-encoding; preserve `/`).
 *  4. Sort query parameters by key, then by value, both lex.
 *  5. Hash the payload (empty string → `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
 *
 * Returns the canonical string, the signed-headers list, and the
 * payload hash, all the pieces the caller needs to assemble the
 * string-to-sign.
 */
export interface CanonicalRequestParts {
  canonicalRequest: string
  signedHeaders: string
  payloadHash: string
}

export async function buildCanonicalRequest(
  request: SigV4Request,
  headersToSign: string[],
): Promise<CanonicalRequestParts> {
  // Step 1+2: lowercase + sort, with trimmed values.
  const normalized = request.headers
    .map((h) => ({
      name: h.name.toLowerCase(),
      value: h.value.replace(/\s+/g, " ").trim(),
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  const signed = headersToSign.map((n) => n.toLowerCase())
  const kept = normalized.filter((h) => signed.includes(h.name))
  const canonicalHeaders = kept
    .map((h) => `${h.name}:${h.value}\n`)
    .join("")
  const signedHeaders = signed.join(";")

  // Step 3: canonical URI.
  const url = new URL(request.url)
  const canonicalUri = canonicalizePath(url.pathname)

  // Step 4: canonical query string.
  const canonicalQueryString = canonicalizeQuery(url.searchParams)

  // Step 5: payload hash.
  const payloadHash = await sha256Hex(request.payload)

  const canonicalRequest = [
    request.method.toUpperCase(),
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  return { canonicalRequest, signedHeaders, payloadHash }
}

/**
 * The string-to-sign that combines the canonical request with the
 * credential scope. Per the SigV4 spec this is built BEFORE the actual
 * signature, then the signature is computed by HMACing it.
 */
export function buildStringToSign(
  amzDate: string,
  credentialScope: string,
  canonicalRequestHash: string,
): string {
  return [ALGORITHM, amzDate, credentialScope, canonicalRequestHash].join("\n")
}

/**
 * Combine (region, service, date) into the credential scope string.
 */
export function credentialScope(
  dateStamp: string,
  region: string,
  service: string,
): string {
  return `${dateStamp}/${region}/${service}/aws4_request`
}

/**
 * Compute the actual signature: HMAC-SHA-256(signing-key, string-to-sign).
 */
export async function computeSignature(
  signingKey: Uint8Array,
  stringToSign: string,
): Promise<string> {
  return hmacSha256Hex(signingKey, stringToSign)
}

// ---------------------------------------------------------------------------
// Top-level: signRequest.
//
// The caller (typically `R2ObjectStore`) assembles its request, calls
// signRequest, and gets back the canonical-signed Authorization header.
// The caller is responsible for merging that header into the actual fetch
// request — the signer does no transport work.
// ---------------------------------------------------------------------------

export interface SignerOptions {
  credentials: SigV4Credentials
  /**
   * List of header names to include in the signed-headers list, in
   * addition to `host`. Common additions are `x-amz-date`, `x-amz-content-sha256`,
   * `range`, `if-none-match`. **Order does not matter** — the signer
   * sorts. Names are case-insensitive.
   */
  additionalHeaders?: string[]
}

export async function signRequest(
  request: SigV4Request,
  options: SignerOptions,
): Promise<SigV4Authorization> {
  const { accessKeyId, secretAccessKey, region, service } = options.credentials

  const date = new Date(request.now)
  const amzDate = formatAmzDate(date)
  const dateStamp = formatDateStamp(date)

  // `host` is mandatory. If the caller did not provide it, derive from
  // the URL — most R2 client code forgets the explicit `host` header.
  const providedNames = new Set(
    request.headers.map((h) => h.name.toLowerCase()),
  )
  if (!providedNames.has("host")) {
    const url = new URL(request.url)
    request.headers.push({ name: "host", value: url.host })
  }
  // Per the AWS SigV4 spec, the SignedHeaders list MUST be sorted by
  // the lowercased header name. We sort here so callers don't have to.
  const headersToSign = [
    "host",
    ...(options.additionalHeaders ?? []),
  ]
    .map((n) => n.toLowerCase())
    .sort()

  // Insert `x-amz-content-sha256` and `x-amz-date` if not already
  // present. They are part of the canonical signed-headers set.
  const parts = await buildCanonicalRequest(request, headersToSign)
  const stringToSign = buildStringToSign(
    amzDate,
    credentialScope(dateStamp, region, service),
    await sha256Hex(parts.canonicalRequest),
  )
  const signingKey = await deriveSigningKey(
    secretAccessKey,
    dateStamp,
    region,
    service,
  )
  const signature = await computeSignature(signingKey, stringToSign)

  const authorization =
    `${ALGORITHM} ` +
    `Credential=${accessKeyId}/${credentialScope(dateStamp, region, service)}, ` +
    `SignedHeaders=${parts.signedHeaders}, ` +
    `Signature=${signature}`

  return {
    authorization,
    amzDate,
    dateStamp,
  }
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/**
 * RFC 3986 URI path canonicalization: percent-encode each segment except
 * for unreserved characters (`A-Z`, `a-z`, `0-9`, `-`, `.`, `_`, `~`). The
 * path separator `/` is preserved. The empty path becomes `/`.
 */
function canonicalizePath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const segments = pathname.split("/")
  return segments
    .map((seg) => encodeURIComponent(seg).replace(/%2F/g, "/"))
    .join("/")
}

/**
 * RFC 3986 query string canonicalization: each pair URI-encoded, then
 * sorted by encoded name, then encoded value.
 */
function canonicalizeQuery(params: URLSearchParams): string {
  const pairs: string[] = []
  const sorted = [...params.keys()].sort()
  for (const key of sorted) {
    const values = params.getAll(key)
    const encodedKey = encodeURIComponent(key)
    for (const value of values) {
      const encodedValue = encodeURIComponent(value)
      pairs.push(`${encodedKey}=${encodedValue}`)
    }
  }
  return pairs.join("&")
}

function formatAmzDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  )
}

function formatDateStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate())
  )
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let s = ""
  for (let i = 0; i < bytes.length; i++) {
    s += (bytes[i] as number).toString(16).padStart(2, "0")
  }
  return s
}
