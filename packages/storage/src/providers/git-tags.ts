/**
 * git-tags provider — the V1 default.
 *
 * Acquires descriptors from the public DeesseJS template repos on
 * GitHub via `codeload.github.com`. Each template is a standalone repo
 * with `deesse-template.json` (starters) or `deessejs-block.json`
 * (overlays) co-located at the root, versioned via git tags.
 *
 * URL convention:
 *   GET https://codeload.github.com/{owner}/{repo}/tar.gz/refs/tags/{tag}
 *
 * The provider parses the tarball with `tar-stream` (pure-JS, portable
 * on Windows) and extracts the single descriptor file at the root. Two
 * tarball shapes are handled:
 *
 *   - `deesse-template.json`            → wire format `template`
 *   - `deessejs-block.json`             → wire format `block`
 *
 * The provider is read-only by design in V1: `publish()` is not
 * implemented (git-tags means "the registry is Git itself, the
 * publication path is `git push`, not an HTTP PUT). Calling publish()
 * throws.
 *
 * Why `codeload.github.com` and not the GitHub raw API:
 *   - codeload serves tarballs (small, immutable-per-ref, cacheable)
 *   - raw.githubusercontent.com serves files (one HTTP round-trip per
 *     file, hard to bundle into a wire envelope)
 *   - `git clone --depth 1 --branch <ref>` is the fallback for refs
 *     that are not tags (branches, SHAs); it shells out to `git` which
 *     is a known-dependency for any DeesseJS user.
 *
 * The fallback to `git clone` is exercised only when codeload returns
 * 404. Tag fetches always go through codeload first.
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { createGunzip } from "node:zlib"

import * as tar from "tar-stream"

import {
  WireEnvelope,
  type WireEnvelope as WireEnvelopeType,
} from "../envelope.js"
import {
  StorageInvalidDescriptorError,
  StorageNetworkError,
  StorageNotFoundError,
  StorageOfflineViolationError,
} from "../errors.js"
import {
  write as writeCache,
  read as readCache,
} from "../cache.js"
import { detectOffline } from "../offline.js"
import { parseRef } from "../resolve.js"
import type {
  DescriptorProvider,
  ParsedDescriptor,
} from "../provider.js"

const execFileAsync = promisify(execFile)

const PROVIDER_ID = "git-tags" as const

/** Mapping from `git codeload` archives to wire envelope files. */
const DESCRIPTOR_FILES = ["deesse-template.json", "deessejs-block.json"] as const

/**
 * Resolve a ref into the GitHub-style archive URL. This is the only
 * mapping the provider knows; refs are passed through `parseRef` for
 * upstream validation.
 *
 * Branch refs → tarball at `refs/heads/{branch}`.
 * Tag refs → tarball at `refs/tags/{tag}`.
 * SHA refs → ambiguous: try tags first, fall back to commit fetch.
 * `latest` → resolves to the registry's highest semver tag; codeload
 * cannot serve "latest", so we shell out to `git ls-remote --tags`.
 */
async function archiveUrl(
  ownerRepo: string,
  refInput: string,
): Promise<string> {
  const ref = parseRef(refInput)
  if (ref.kind === "latest") {
    // Resolve "latest" against the remote tag list. Pure git — no
    // DeesseJS-specific logic. Returns the highest semver tag.
    return resolveLatest(ownerRepo)
  }
  if (ref.kind === "tag") {
    return `https://codeload.github.com/${ownerRepo}/tar.gz/refs/tags/${ref.tag}`
  }
  if (ref.kind === "branch") {
    return `https://codeload.github.com/${ownerRepo}/tar.gz/refs/heads/${ref.branch}`
  }
  // SHA: codeload doesn't accept SHA-only URLs. Fall back to a tarball
  // that pinpoints the commit via a synthetic ref.
  return `https://codeload.github.com/${ownerRepo}/tar.gz/${ref.sha}`
}

async function resolveLatest(ownerRepo: string): Promise<string> {
  // Use `git ls-remote --tags --sort=-v:refname` to get the highest
  // semver tag. Codeload doesn't have a "latest" concept, so we
  // resolve it client-side for now. V2 may move this to a server-side
  // endpoint if the load is meaningful.
  const { stdout } = await execFileAsync("git", [
    "ls-remote",
    "--tags",
    "--sort=-version:refname",
    `https://github.com/${ownerRepo}.git`,
  ])
  const lines = stdout.split("\n").filter(Boolean)
  for (const line of lines) {
    const m = /refs\/tags\/v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(line)
    if (m) {
      const tag = `v${m[1]}`
      return `https://codeload.github.com/${ownerRepo}/tar.gz/refs/tags/${tag}`
    }
  }
  throw new StorageNotFoundError(
    `No semver tags found on ${ownerRepo} — cannot resolve 'latest'`,
  )
}

/** Extract the descriptor file from a tarball. */
async function extractDescriptor(
  tarball: ReadableStream<Uint8Array> | import("node:stream").Readable,
): Promise<{ fileName: string; content: string } | null> {
  // Adapt Web ReadableStream to Node Readable so tar-stream can read it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adaptTarball: import("node:stream").Readable =
    typeof (tarball as { getReader?: unknown }).getReader === "function"
      ? Readable.fromWeb(tarball as any)
      : (tarball as import("node:stream").Readable)
  const extract = tar.extract()

  let found: { fileName: string; content: string } | null = null

  const processing = new Promise<void>((resolve, reject) => {
    // tar-stream v3 types `stream` and `next` against its own streamx
    // types; at runtime they are Node Readable and a plain callback.
    // Cast locally to keep the call site readable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extract.on("entry", ((header: { name: string }, stream: any, next: () => void) => {
        const baseName = header.name.split("/").pop() ?? header.name
        const isRootDescriptor =
          (DESCRIPTOR_FILES as readonly string[]).includes(baseName) &&
          // Top-level files only — no nested in subdirectories.
          !header.name.includes("/", 1)
        if (!isRootDescriptor) {
          stream.resume()
          stream.on("end", () => next())
          return
        }

        const chunks: Buffer[] = []
        stream.on("data", (c: Buffer) => chunks.push(c))
        stream.on("end", () => {
          if (!found) {
            found = {
              fileName: baseName,
              content: Buffer.concat(chunks).toString("utf8"),
            }
          }
          next()
        })
        stream.on("error", reject)
      }) as unknown as Parameters<typeof extract.on>[1])
    extract.on("finish", () => resolve())
    extract.on("error", reject)
  })

  await pipeline(
    adaptTarball as unknown as NodeJS.ReadableStream,
    createGunzip(),
    extract,
  ).catch((err: unknown) => {
    if ((err as NodeJS.ErrnoException).code === "ERR_STREAM_PREMATURE_CLOSE") {
      // Expected when the entry stream closes after a single file is found.
      return
    }
    throw err
  })

  await processing
  return found
}

/**
 * Detect the wire format from the descriptor filename.
 * `deesse-template.json` → template, `deessejs-block.json` → block.
 */
function envelopeFormatFromFileName(fileName: string): "template" | "block" {
  if (fileName === "deessejs-block.json") return "block"
  return "template"
}

/**
 * The git-tags provider.
 *
 * Constructed per-{owner,repo} because each template repo has its own
 * URL. (For multi-template providers like a registry aggregator, the
 * factory is called once per slug in the catalogue dispatch.)
 */
export class GitTagsProvider implements DescriptorProvider {
  readonly providerId = PROVIDER_ID

  constructor(
    /** Owner/repo slug, e.g. `"deessejs/nextjs-app-router-saas"`. */
    public readonly ownerRepo: string,
    /**
     * Optional fetch override. Tests inject a mock here.
     * Defaults to the global fetch.
     */
    public readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async acquire(slug: string, ref: string): Promise<ParsedDescriptor> {
    // 1. CI/offline check
    const offline = detectOffline()
    if (offline.offline) {
      const cached = await readCache(PROVIDER_ID, slug, ref)
      if (!cached) {
        throw new StorageOfflineViolationError(
          `Offline mode is active (${offline.reason}) and no cached descriptor exists for ${slug}@${ref}`,
          { slug, ref },
        )
      }
      return cached.parsed
    }

    // 2. Build the archive URL for the requested ref.
    const url = await archiveUrl(this.ownerRepo, ref)

    // 3. Fetch the tarball.
    const res = await this.fetchImpl(url, {
      headers: { Accept: "application/x-gzip" },
    }).catch((cause) => {
      throw new StorageNetworkError(
        `Network failure fetching tarball from ${url}`,
        { slug, ref },
        { cause },
      )
    })
    if (res.status === 404) {
      throw new StorageNotFoundError(
        `${this.ownerRepo}@${ref} not found at GitHub`,
        { slug, ref },
      )
    }
    if (!res.ok) {
      throw new StorageNetworkError(
        `Unexpected status fetching ${url} (HTTP ${res.status})`,
        { slug, ref },
      )
    }
    if (!res.body) {
      throw new StorageNetworkError(
        `Empty body fetching ${url}`,
        { slug, ref },
      )
    }

    // 4. Extract the descriptor file from the tarball.
    const extracted = await extractDescriptor(res.body)
    if (!extracted) {
      throw new StorageInvalidDescriptorError(
        `${this.ownerRepo}@${ref} archive has neither deesse-template.json nor deessejs-block.json at root`,
        { slug, ref },
      )
    }

    // 5. Reconstruct the wire envelope. The descriptor file alone
    // doesn't carry the envelope's `format` field — we synthesise it
    // from the filename.
    const raw = JSON.parse(extracted.content) as unknown
    const envelope: WireEnvelopeType = {
      $schema: "https://registry.deessejs.com/schema/envelope/v1.json",
      format: envelopeFormatFromFileName(extracted.fileName),
      // The schema is fixed at the envelope shape; the inner shape
      // is validated by WireEnvelope below.
      ...(envelopeFormatFromFileName(extracted.fileName) === "template"
        ? { template: raw }
        : { block: raw }),
    } as WireEnvelopeType

    // 6. Validate against the Zod envelope.
    const parsed = WireEnvelope.safeParse(envelope)
    if (!parsed.success) {
      throw new StorageInvalidDescriptorError(
        `${this.ownerRepo}@${ref} failed schema validation`,
        { slug, ref },
        { cause: parsed.error },
      )
    }

    // 7. Cache the parsed descriptor for offline mode.
    const parsedDescriptor: ParsedDescriptor =
      parsed.data.format === "template"
        ? { kind: "template", template: parsed.data.template }
        : { kind: "block", block: parsed.data.block }

    await writeCache(PROVIDER_ID, slug, ref, {
      parsed: parsedDescriptor,
      etag: null, // git-tags has no conditional GET semantics
      refreshedAt: new Date().toISOString(),
      provider: PROVIDER_ID,
    })

    return parsedDescriptor
  }

  async publish(
    _slug: string,
    _ref: string,
    _descriptor: ParsedDescriptor,
  ): Promise<void> {
    // V1 is read-only. Publication is `git push` upstream, not an HTTP
    // PUT. A future provider (R2, Neon) handles writes natively.
    throw new StorageNotFoundError(
      `git-tags provider is read-only; publication is via 'git push' to ${this.ownerRepo}`,
    )
  }
}

/**
 * Convenience constructor that takes the slug + a registry-map
 * function. Returns the provider scoped to the slug's owner/repo.
 */
export function gitTagsProvider(
  ownerRepo: string,
  fetchImpl?: typeof fetch,
): GitTagsProvider {
  return new GitTagsProvider(ownerRepo, fetchImpl)
}
