/**
 * Local filesystem implementation of {@link ObjectStore}.
 *
 * Functional style: `createLocalFsObjectStore(options)` returns an
 * `ObjectStore` whose methods are plain async functions that close
 * over the resolved `root`. All side effects go through
 * `node:fs/promises`; everything else (key resolution, recursive
 * walking, prefix normalisation) is pure.
 *
 * For dev, CI, and tests. Not a production backend — there is no
 * replication, no concurrency control beyond POSIX rename semantics,
 * and no auth.
 *
 * Key safety: `put()` rejects keys that contain absolute path
 * components (`/foo`, `..`, `\\foo`). The key space is flat; slashes
 * are mapped to directory separators under the configured root.
 *
 * Atomicity: `put()` writes to `<key>.tmp.<random>` then renames.
 * Concurrent puts to the same key race on the rename, but the
 * outcome is one of the two complete bodies (the older one or the
 * newer one) — never partial, never a torn file.
 *
 * Permissions: never explicitly sets file modes. The OS default
 * applies.
 */

import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { Readable } from "node:stream"

import { StorageError } from "../errors.js"
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

/**
 * Resolve `root` once. Pure, no I/O aside from path normalisation.
 */
function resolveRoot(root: string): string {
  if (!root || root === "") {
    throw new StorageError(
      "storage.invalid_root",
      "createLocalFsObjectStore requires a non-empty root path",
    )
  }
  return path.resolve(root)
}

/**
 * Validate `key` and translate it to an absolute filesystem path
 * inside `root`. Pure: no I/O, just string manipulation.
 */
function resolveKey(root: string, key: ObjectKey): string {
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
  const target = path.resolve(root, key)
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep
  if (!target.startsWith(rootWithSep) && target !== root) {
    throw new StorageError(
      "storage.invalid_key",
      `ObjectStore key escapes the configured root: ${key}`,
      { key },
    )
  }
  return target
}

/**
 * Recursively walk `dir`. Yields every file whose key (relative to
 * `root`, with `/` as separator) starts with `prefixFilter`.
 *
 * Always descends into every subdirectory — descent is cheap, and
 * the filter is applied at emission time. Handles arbitrary
 * nesting (a/b/c/d/file.json) without bespoke prefix-path
 * bookkeeping.
 *
 * Pure-ish: one fs.readdir per directory, but no hidden state.
 */
async function* walk(
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
      yield* walk(full, key, prefixFilter)
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

/** Normalise a list() prefix to "" or "foo/" (always ends with "/"). */
function normalisePrefix(prefix: ObjectKey | undefined): string {
  if (prefix === undefined) return ""
  return prefix.endsWith("/") ? prefix : `${prefix}/`
}

/** Wrap a Uint8Array in a Web ReadableStream. Pure. */
function bytesToWebStream(bytes: Uint8Array): ObjectBody {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes))
      controller.close()
    },
  })
}

/**
 * Build an {@link ObjectStore} backed by the local filesystem.
 *
 * The returned object's methods close over `root` (resolved once
 * at construction time). There is no class instance to mutate;
 * if you need different roots, call this factory again.
 */
export function createLocalFsObjectStore(
  options: LocalFsOptions,
): ObjectStore {
  const root = resolveRoot(options.root)

  return {
    async put(key, body) {
      const target = resolveKey(root, key)
      const dir = path.dirname(target)
      const tmp = `${target}.tmp.${process.pid}.${crypto.randomBytes(6).toString("hex")}`
      try {
        await fs.mkdir(dir, { recursive: true })
        if (body instanceof Uint8Array) {
          await fs.writeFile(tmp, body)
        } else {
          // Web ReadableStream → Node Readable → fs.writeFile.
          // The cast on `Readable.fromWeb` is because some
          // libraries (e.g. tar-stream) overload the global
          // ReadableStream; at runtime the input is a Web stream.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nodeSrc = Readable.fromWeb(body as unknown as any)
          await fs.writeFile(tmp, nodeSrc as unknown as NodeJS.ReadableStream)
        }
        await fs.rename(tmp, target)
      } catch (err) {
        // Best-effort cleanup. A stale .tmp is harmless and will
        // be overwritten on the next successful put().
        await fs.unlink(tmp).catch(() => undefined)
        throw err
      }
    },

    async get(key) {
      const target = resolveKey(root, key)
      try {
        const stat = await fs.stat(target)
        if (!stat.isFile()) return null
        const buf = await fs.readFile(target)
        return bytesToWebStream(buf)
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code
        if (code === "ENOENT" || code === "EISDIR") return null
        throw err
      }
    },

    async delete(key) {
      const target = resolveKey(root, key)
      try {
        await fs.unlink(target)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
        // Idempotent: already-absent is success.
      }
    },

    async head(key) {
      const target = resolveKey(root, key)
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
    },

    async *list(prefix) {
      // Locked contract: prefix is a key-prefix filter, not a
      // directory path. list("dir/b") returns keys under dir/b/.
      const filter = normalisePrefix(prefix)
      yield* walk(root, "", filter)
    },
  }
}
