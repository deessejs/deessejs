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

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name === ".vc-config.json") {
      const config = JSON.parse(await readFile(fullPath, "utf8"));
      if (config.filePathMap && typeof config.filePathMap === "object") {
        for (const candidate of collectStrings(config.filePathMap)) {
          const portable = candidate.replaceAll("\\", "/").replace(/^\.\//, "");
          if (
            !portable ||
            portable.startsWith("/") ||
            /^[a-zA-Z]:\//.test(portable) ||
            portable.split("/").includes("..") ||
            /[\0\r\n]/.test(portable)
          ) {
            continue;
          }
          if (portable === ".vercel/output" || portable.startsWith(".vercel/output/")) {
            continue;
          }

          const absolutePath = path.resolve(repoRoot, portable);
          const relativeToRoot = path.relative(repoRoot, absolutePath);
          if (
            relativeToRoot.startsWith("..") ||
            path.isAbsolute(relativeToRoot) ||
            isSensitivePath(relativeToRoot)
          ) {
            if (isSensitivePath(relativeToRoot)) {
              throw new Error("Refusing to package a sensitive file path from filePathMap: " + relativeToRoot);
            }
            continue;
          }

          try {
            const fileInfo = await stat(absolutePath);
            if (!fileInfo.isFile()) continue;
            const resolvedPath = await realpath(absolutePath);
            const resolvedRelativePath = path.relative(repoRoot, resolvedPath);
            if (
              resolvedRelativePath.startsWith("..") ||
              path.isAbsolute(resolvedRelativePath) ||
              isSensitivePath(resolvedRelativePath)
            ) {
              throw new Error("Refusing to package a sensitive or external file: " + relativeToRoot);
            }
            relativeFiles.add(relativeToRoot.split(path.sep).join("/"));
          } catch (error) {
            if (error?.code === "ENOENT" || error?.code === "ENOTDIR") continue;
            throw error;
          }
        }
      }
    }
  }
}

await walk(outputRoot);
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

let totalBytes = 0;
for (const file of sortedFiles) {
  totalBytes += (await stat(path.resolve(repoRoot, file))).size;
}
console.log(
  "Packaged " + sortedFiles.length + " Vercel filePathMap files (" +
  (totalBytes / 1024 / 1024).toFixed(1) + " MiB uncompressed).",
);
