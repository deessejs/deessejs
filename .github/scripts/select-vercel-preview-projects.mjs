import { appendFile } from "node:fs/promises";
import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const projects = [
  { app: "docs", directory: "apps/docs", package: "@workspace/docs", project_id: "prj_TjmKPgxU8po3FDjQVkprdIRGgXa4" },
  { app: "agent", directory: "apps/agent", package: "agent", project_id: "prj_XpSk71L2P6VCrZNA1P34hlTIWajc" },
  { app: "web", directory: "apps/web", package: "web", project_id: "prj_EDu0GMa3fKaInW6f3MBiLCiewi6O" },
  { app: "app", directory: "apps/app", package: "app", project_id: "prj_IOf5cRl1rkbc6SfSMzLsKsneYPdb" },
];
const globalFiles = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "turbo.json",
  ".npmrc",
  ".node-version",
  ".nvmrc",
]);
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function isRepositoryMetadata(file) {
  const base = path.posix.basename(file);
  return (
    file.startsWith(".github/") ||
    file.startsWith(".changeset/") ||
    file.startsWith("docs/") ||
    base.startsWith("README") ||
    base.startsWith("LICENSE") ||
    base.startsWith("CONTRIBUTING") ||
    base.startsWith("CODE_OF_CONDUCT") ||
    base === ".gitignore" ||
    base === ".gitattributes" ||
    base === ".editorconfig" ||
    base === ".prettierignore" ||
    base.startsWith(".prettierrc")
  );
}

async function readWorkspacePackages() {
  const packages = [];
  for (const root of ["apps", "packages"]) {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = root + "/" + entry.name;
      const manifest = JSON.parse(
        await readFile(directory + "/package.json", "utf8"),
      );
      if (typeof manifest.name !== "string" || manifest.name.length === 0) {
        throw new Error("Workspace package has no name: " + directory);
      }
      packages.push({ name: manifest.name, directory, manifest });
    }
  }

  const names = new Set();
  for (const pkg of packages) {
    if (names.has(pkg.name)) throw new Error("Duplicate workspace package: " + pkg.name);
    names.add(pkg.name);
  }
  return packages;
}

function packageForPath(file, packages) {
  return packages.find(
    (pkg) => file === pkg.directory || file.startsWith(pkg.directory + "/"),
  );
}

function dependencyClosure(packageName, packagesByName) {
  const found = new Set();
  const visit = (name) => {
    if (found.has(name)) return;
    const pkg = packagesByName.get(name);
    if (!pkg) return;
    found.add(name);
    for (const field of dependencyFields) {
      for (const dependency of Object.keys(pkg.manifest[field] ?? {})) {
        if (packagesByName.has(dependency)) visit(dependency);
      }
    }
  };
  visit(packageName);
  return found;
}

async function main() {
  const [baseSha, headSha] = process.argv.slice(2);
  if (!/^[0-9a-f]{40}$/i.test(baseSha ?? "") || !/^[0-9a-f]{40}$/i.test(headSha ?? "")) {
    throw new Error("Expected full base and head commit SHAs.");
  }

  const packages = await readWorkspacePackages();
  const packagesByName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  for (const project of projects) {
    if (!packagesByName.has(project.package)) {
      throw new Error("Vercel project package is missing: " + project.package);
    }
  }

  const mergeBase = git(["merge-base", baseSha, headSha]);
  const commits = git([
    "rev-list",
    "--first-parent",
    "--reverse",
    "--no-merges",
    mergeBase + ".." + headSha,
  ])
    .split(/\r?\n/)
    .filter(Boolean);

  const changedPackages = new Set();
  let globalChange = false;

  for (const commit of commits) {
    const parent = git(["rev-parse", commit + "^1"]);
    const changedFiles = git([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "--no-renames",
      "-r",
      parent,
      commit,
    ])
      .split(/\r?\n/)
      .filter(Boolean);

    for (const file of changedFiles) {
      if (globalFiles.has(file)) {
        globalChange = true;
        break;
      }
      if (isRepositoryMetadata(file)) continue;

      const pkg = packageForPath(file, packages);
      if (pkg) {
        changedPackages.add(pkg.name);
      } else if (file.startsWith("apps/") || file.startsWith("packages/")) {
        // A removed or malformed workspace package cannot be mapped safely.
        globalChange = true;
        break;
      } else {
        // Unknown root-level files may influence the build; fail closed.
        globalChange = true;
        break;
      }
    }

    if (globalChange) break;
  }

  const matrix = globalChange
    ? projects
    : projects.filter((project) => {
        const closure = dependencyClosure(project.package, packagesByName);
        return [...changedPackages].some((name) => closure.has(name));
      });

  const outputFile = process.env.GITHUB_OUTPUT;
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!outputFile || !summaryFile) {
    throw new Error("GitHub Actions output paths are missing.");
  }

  await appendFile(
    outputFile,
    "matrix=" + JSON.stringify(matrix) + "\n" +
      "has_projects=" + String(matrix.length > 0) + "\n",
  );

  const summary = matrix.length === 0
    ? "No Vercel project is affected by this pull request."
    : matrix.map((project) => "- " + project.app).join("\n");
  await appendFile(summaryFile, "### Vercel preview selection\n" + summary + "\n");
}

main().catch(async (error) => {
  console.error("::warning::Affected-project detection failed; deploying all Vercel projects.");
  console.error(error);
  const outputFile = process.env.GITHUB_OUTPUT;
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!outputFile || !summaryFile) process.exitCode = 1;
  else {
    await appendFile(
      outputFile,
      "matrix=" + JSON.stringify(projects) + "\n" + "has_projects=true\n",
    );
    await appendFile(
      summaryFile,
      "### Vercel preview selection\nChange detection failed; selected all four projects.\n",
    );
  }
});
