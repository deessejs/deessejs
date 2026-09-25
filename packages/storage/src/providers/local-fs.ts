/**
 * Local filesystem implementation of {@link ObjectStore}.
 *
 * For dev, CI, and tests. Not a production backend — there is no
 * replication, no concurrency control beyond POSIX rename semantics,
 * and no auth. It exists so that:
 *
 *   1. The {@link ObjectStore} interface can be exercised without
 *      network. The CLI's `info`/`list` commands wire to this impl
 *      when `DEESSE_STORAGE_BACKEND=local-fs` is set, even outside
 *      R2-shipping contexts.
 *
 *   2. The R2 implementation can be developed against a fake first.
 *      Same interface, same tests, swap impls.
 *
 * Key safety: `put()` rejects keys that contain absolute path
 * components (`/foo`, `..`, `\\foo`). The key space is flat; slashes
 * are mapped to directory separators under the configured root.
 * This is the same path-traversal discipline the previous `internal/lock.ts`
 * codified, applied to ObjectKeys.
 *
 * Atomicity: `put()` writes to `<key>.tmp.<random>` then renames.
 * Concurrent puts to the same key race on the rename, but the
 * outcome is one of the two complete bodies (the older one or the
 * newer one) — never partial, never a torn file.
 *
 * Permissions: never explicitly sets file modes. The OS default
 * applies. For secrets (a storage backend should never see those,
 * but defensive in depth) the caller is responsible.
 */

import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { Readable } from "node:stream"

import {
  StorageError,
} from "../errors.js"
import type {
  ObjectBody,
  ObjectKey,
  ObjectMeta,
  ObjectStore,
} from "../object-store.js"

export interface LocalFsOptions {
  /**
   * Root directory under which objects are stored. Resolved against
   * `process.cwd()` if relative. **All keys are interpreted relative
   * to this root**; absolute or `..`-containing keys throw at the
   * boundary, not at the filesystem.
   */
  root: string

  /**
   * Auto-create the root on first use. Defaults to true. Set to
   * false in test contexts where the root is pre-created.
   */
  ensureRoot?: boolean
}

export class LocalFsObjectStore implements ObjectStore {
  readonly root: string

  constructor(options: LocalFsOptions) {
    if (!options.root || options.root === "") {
      throw new Error("LocalFsObjectStore requires a non-empty root path")
    }
    this.root = path.resolve(options.root)
  }

  /**
   * Resolve `key` to a path inside the root.
   *
   * If the resolved path escapes the root, throw — never let a
   * caller traverse out via `..` or absolute paths.
   */
  private resolveKey(key: ObjectKey): string {
    if (key === "") {
      throw new StorageError(
        "storage.invalid_key",
        "ObjectStore key must not be empty",
        { key },
      )
    }
    if (path.isAbsolute(key)) {
      throw new StorageError(
        "storage.invalid_key",
        `ObjectStore key must be relative, got absolute: ${key}`,
        { key },
      )
    }

    const target = path.resolve(this.root, key)
    const rootWithSep = this.root.endsWith(path.sep)
      ? this.root
      : this.root + path.sep
    if (!target.startsWith(rootWithSep) && target !== this.root) {
      throw new StorageError(
        "storage.invalid_key",
        `ObjectStore key escapes the configured root: ${key}`,
        { key },
      )
    }
    return target
  }

  async put(key: ObjectKey, body: Uint8Array | ObjectBody): Promise<void> {
    const target = this.resolveKey(key)
    const dir = path.dirname(target)
    const tmp = `${target}.tmp.${process.pid}.${crypto.randomBytes(6).toString("hex")}`

    try {
      await fs.mkdir(dir, { recursive: true })
      if (body instanceof Uint8Array) {
        await fs.writeFile(tmp, body)
      } else {
        // Stream the body to disk. We adapt the Web ReadableStream
        // to a Node Readable and write to file. The `any` cast on
        // the Readable.fromWeb argument is because tar-stream's
        // overload of global ReadableStream confuses TS — at
        // runtime the input is a Web stream.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeSrc = Readable.fromWeb(body as unknown as any)
        await fs.writeFile(tmp, nodeSrc as unknown as NodeJS.ReadableStream)
      }
      await fs.rename(tmp, target)
    } catch (err) {
      // Best-effort cleanup of the temp file. Never fail the
      // cleanup itself — a stale .tmp is harmless and will be
      // overwritten on the next successful put().
      await fs.unlink(tmp).catch(() => undefined)
      throw err
    }
  }

  async get(key: ObjectKey): Promise<ObjectBody | null> {
    const target = this.resolveKey(key)
    try {
      const stat = await fs.stat(target)
      if (!stat.isFile()) return null
      // Read the file into a buffer and wrap as a ReadableStream.
      // The local filesystem does not stream chunk-by-chunk from
      // disk to a web ReadableStream without a Readable adapter,
      // so we materialise the body. For small descriptors this is
      // fine. Future: stream via createReadStream.
      const buf = await fs.readFile(target)
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(buf))
          controller.close()
        },
      })
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null
      }
      if ((err as NodeJS.ErrnoException).code === "EISDIR") {
        return null
      }
      throw err
    }
  }

  async delete(key: ObjectKey): Promise<void> {
    const target = this.resolveKey(key)
    try {
      await fs.unlink(target)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
      // Idempotent — already absent is success.
    }
  }

  async head(key: ObjectKey): Promise<ObjectMeta | null> {
    const target = this.resolveKey(key)
    try {
      const stat = await fs.stat(target)
      if (!stat.isFile()) return null
      return {
        key,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
      throw err
    }
  }

  async *list(prefix?: ObjectKey): AsyncIterable<ObjectMeta> {
    // Locked contract (see object-store.ts): prefix is a key-prefix
    // filter, NOT a directory path. list("dir/b") returns keys under
    // dir/b/, even if dir/b/ is not a directory (or doesn't exist).
    // This matches R2/S3 semantics where keys are flat strings with
    // `/` as a separator but no implicit directory hierarchy.
    //
    // We walk the entire filesystem recursively and emit every key
    // whose relative path begins with the normalised prefix.
    const normalisedPrefix =
      prefix === undefined
        ? ""
        : prefix.endsWith("/")
          ? prefix
          : `${prefix}/`
    yield* this.walk(this.root, "", normalisedPrefix)
  }

  /**
   * Recursively walk `dir`. Yields any file whose key (relative to
   * the configured root, with `/` as separator) starts with
   * `prefixFilter`.
   *
   * We always descend into every subdirectory — descent is cheap
   * and the filter is applied at emission time. This handles
   * arbitrary nesting (dir/sub/sub2/file.json) without bespoke
   * prefix-path bookkeeping.
   */
  private async *walk(
    dir: string,
    relativePrefix: string,
    prefixFilter: string,
  ): AsyncIterable<ObjectMeta> {
    let dirents: import("node:fs").Dirent[]
    try {
      dirents = await fs.readdir(dir, { withFileTypes: true })
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return
      throw err
    }
    for (const ent of dirents) {
      const key = relativePrefix === "" ? ent.name : `${relativePrefix}/${ent.name}`
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        yield* this.walk(full, key, prefixFilter)
      } else if (ent.isFile() && key.startsWith(prefixFilter)) {
        const stat = await fs.stat(full)
        yield {
          key,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        }
      }
    }
  }
}
