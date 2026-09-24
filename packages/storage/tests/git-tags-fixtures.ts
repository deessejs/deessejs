/**
 * Test fixtures for the git-tags provider.
 *
 * Builds in-memory gzip+tar buffers that mimic what codeload.github.com
 * would return for a tarball of a template or block repo. The buffer
 * is consumed as a `ReadableStream<Uint8Array>` (the Web Streams API
 * shape that fetch returns), so providers can be tested without
 * touching the network.
 */

import { gzipSync } from "node:zlib"
import { pack as tarPack } from "tar-stream"

export interface TarEntry {
  /** Tar header name. Set to e.g. `"deesse-template.json"` for root. */
  name: string
  /** File content as a UTF-8 string. */
  content: string
}

/**
 * Build a gzip-compressed tar `ReadableStream<Uint8Array>` from the
 * given file entries. The returned stream is what `fetch(...).body`
 * would deliver from codeload.github.com.
 */
export async function buildGzipTarball(
  entries: TarEntry[],
): Promise<ReadableStream<Uint8Array>> {
  const chunks: Uint8Array[] = []

  // Pack entries into a tar buffer.
  const pack = tarPack()
  for (const e of entries) {
    await new Promise<void>((resolve, reject) => {
      pack.entry(
        { name: e.name, size: Buffer.byteLength(e.content) },
        e.content,
        (err: Error | null) => (err ? reject(err) : resolve()),
      )
    })
  }
  pack.finalize()

  // Drain the pack into a single Buffer.
  for await (const chunk of pack as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk)
  }
  const tarBuffer = Buffer.concat(chunks)

  // Gzip it.
  const gzipped = gzipSync(tarBuffer)

  // Adapt to a Web ReadableStream.
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(gzipped))
      controller.close()
    },
  })
}

/**
 * Convenience: build a template tarball with `deesse-template.json`
 * at the root.
 */
export async function buildTemplateTarball(
  templateJson: object,
): Promise<ReadableStream<Uint8Array>> {
  return buildGzipTarball([
    { name: "deesse-template.json", content: JSON.stringify(templateJson) },
  ])
}

/**
 * Convenience: build a block tarball with `deessejs-block.json`
 * at the root.
 */
export async function buildBlockTarball(
  blockJson: object,
): Promise<ReadableStream<Uint8Array>> {
  return buildGzipTarball([
    { name: "deessejs-block.json", content: JSON.stringify(blockJson) },
  ])
}

/**
 * Build a template tarball that does NOT contain either descriptor
 * file at the root — used to test the "missing descriptor" error
 * path.
 */
export async function buildEmptyTarball(): Promise<ReadableStream<Uint8Array>> {
  return buildGzipTarball([
    { name: "README.md", content: "# no descriptor here" },
    { name: "src/index.ts", content: "export {}" },
  ])
}

/**
 * Minimal valid TemplateV2-shaped object for tarball payloads.
 * Caller may override any field.
 */
export function minimalTemplateV2(overrides: Record<string, unknown> = {}) {
  return {
    $schema: "https://registry.deessejs.com/schema/template/v2.json",
    name: "test-template",
    title: "Test Template",
    type: "template:app",
    version: "1.0.0",
    source: { repo: "test-owner/test-template", ref: "v1.0.0" },
    requires: { runtime: "nextjs" },
    ...overrides,
  }
}

/**
 * Minimal valid BlockV1-shaped object for tarball payloads.
 */
export function minimalBlockV1(overrides: Record<string, unknown> = {}) {
  return {
    $schema: "https://registry.deessejs.com/schema/block/v1.json",
    name: "test-block",
    title: "Test Block",
    type: "block:feature",
    version: "1.0.0",
    source: { repo: "test-owner/test-block", ref: "v1.0.0" },
    requires: { runtime: "nextjs" },
    ...overrides,
  }
}
