#!/usr/bin/env node
/**
 * Package the project-root files referenced by Vercel Build Output API
 * function configs. A deploy-only runner does not have the original checkout,
 * but filePathMap entries are resolved relative to that checkout.
 */
import { readdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const outputRoot = path.resolve(repoRoot, ".vercel/output");
const archivePath = path.resolve(repoRoot, ".vercel/prebuilt-context.tar.gz");
const listPath = path.resolve(repoRoot, ".vercel/prebuilt-context-files.list");

const relativeFiles = new Set();

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function isSensitivePath(relativePath) {
  const segments = relativePath.toLowerCase().split("/");
  return segments.some((segment) =>
    segment.startsWith(".env") ||
    [".vercel", ".git", ".npmrc", ".netrc"].includes(segment) ||
    /\.(pem|key|p12|pfx)$/i.test(segment) ||
    /(^|[-_.])(secret|credential|private[-_]?key)([-_.]|$)/i.test(segment)
  );
}

function isInsideRepository(absolutePath) {
  const relativePath = path.relative(repoRoot, absolutePath);
  return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function isBuildDirectory(relativePath) {
  const segments = relativePath.split("/");
  return segments.includes("node_modules") || segments.includes(".next");
}

async function addDirectoryFiles(aliasPath, absolutePath, ancestors = new Set()) {
  const resolvedPath = await realpath(absolutePath);
  if (!isInsideRepository(resolvedPath)) {
    throw new Error("Refusing to package a directory outside the repository: " + aliasPath);
  }

  const resolvedRelativePath = path.relative(repoRoot, resolvedPath).split(path.sep).join("/");
  if (isSensitivePath(aliasPath) || isSensitivePath(resolvedRelativePath)) return;
  if (ancestors.has(resolvedPath)) return;

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(resolvedPath);

  for (const entry of await readdir(absolutePath, { withFileTypes: true })) {
    const childPath = path.posix.join(aliasPath, entry.name);
    const childAbsolutePath = path.resolve(repoRoot, childPath);
    if (isSensitivePath(childPath)) continue;

    try {
      const childInfo = await stat(childAbsolutePath);
      const childResolvedPath = await realpath(childAbsolutePath);
      if (!isInsideRepository(childResolvedPath)) {
        throw new Error("Refusing to package a path outside the repository: " + childPath);
      }

      const childResolvedRelativePath = path.relative(repoRoot, childResolvedPath).split(path.sep).join("/");
      if (isSensitivePath(childResolvedRelativePath)) continue;

      if (childInfo.isFile()) {
        relativeFiles.add(childPath);
      } else if (childInfo.isDirectory()) {
        await addDirectoryFiles(childPath, childAbsolutePath, nextAncestors);
      }
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") continue;
      throw error;
    }
  }
}

async function addReferencedPath(candidate) {
  const portable = candidate.replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    !portable ||
    portable.startsWith("/") ||
    /^[a-zA-Z]:\//.test(portable) ||
    portable.split("/").includes("..") ||
    /[\0\r\n]/.test(portable)
  ) {
    return;
  }
  if (portable === ".vercel/output" || portable.startsWith(".vercel/output/")) return;

  const absolutePath = path.resolve(repoRoot, portable);
  const relativeToRoot = path.relative(repoRoot, absolutePath).split(path.sep).join("/");
  if (!isInsideRepository(absolutePath)) return;
  if (isSensitivePath(relativeToRoot)) {
    throw new Error("Refusing to package a sensitive file path from filePathMap: " + relativeToRoot);
  }

  try {
    const fileInfo = await stat(absolutePath);
    const resolvedPath = await realpath(absolutePath);
    if (!isInsideRepository(resolvedPath)) {
      throw new Error("Refusing to package a path outside the repository: " + relativeToRoot);
    }

    const resolvedRelativePath = path.relative(repoRoot, resolvedPath).split(path.sep).join("/");
    if (isSensitivePath(resolvedRelativePath)) {
      throw new Error("Refusing to package a sensitive or external file: " + relativeToRoot);
    }

    if (fileInfo.isFile()) {
      relativeFiles.add(relativeToRoot);
    } else if (fileInfo.isDirectory() && isBuildDirectory(relativeToRoot)) {
      // filePathMap may name a package directory rather than individual files.
      // Expand it into filtered files so pnpm package links exist on the clean runner.
      await addDirectoryFiles(relativeToRoot, absolutePath);
    }
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return;
    throw error;
  }
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name === ".vc-config.json") {
      const config = JSON.parse(await readFile(fullPath, "utf8"));
      if (config.filePathMap && typeof config.filePathMap === "object") {
        for (const candidate of collectStrings(config.filePathMap)) {
          await addReferencedPath(candidate);
        }
      }
    }
  }
}

await walk(outputRoot);

// Next.js output traces do not include every file needed by Vercel's runtime
// launcher. Preserve the full Next package at the configured project root.
const projectRoot = process.env.VERCEL_PROJECT_ROOT;
const allowedProjectRoots = new Set([
  "apps/docs",
  "apps/agent",
  "apps/web",
  "apps/app",
]);
if (!allowedProjectRoots.has(projectRoot ?? "")) {
  throw new Error("VERCEL_PROJECT_ROOT must name a configured Vercel app root.");
}
await addReferencedPath(`${projectRoot}/node_modules/next`);

if (relativeFiles.size === 0) {
  throw new Error("No project-root files were found in Vercel function filePathMap entries.");
}

const sortedFiles = [...relativeFiles].sort();
await writeFile(listPath, sortedFiles.map((file) => file + "\0").join(""), "utf8");

const tar = spawnSync(
  "tar",
  ["--dereference", "-czf", archivePath, "--null", "-T", listPath],
  { cwd: repoRoot, stdio: "inherit" },
);
if (tar.error) throw tar.error;
if (tar.status !== 0) process.exit(tar.status ?? 1);

const archiveSize = (await stat(archivePath)).size;
console.log(
  "Packaged " + sortedFiles.length + " Vercel filePathMap files, including referenced directories (" +
  (archiveSize / 1024 / 1024).toFixed(1) + " MiB compressed).",
);
