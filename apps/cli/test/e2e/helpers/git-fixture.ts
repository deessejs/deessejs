import { execa } from "execa"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, sep } from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Bare git repo fixture for the `init` e2e suite.
 *
 * Creates a fresh bare git repo at <tmpdir>/repo.git with a `main`
 * branch and a single commit. The commit contains one file,
 * README.md, with a fixed content. The bare path is exposed as a
 * `file://` URL that the CLI can clone.
 *
 * The bare repo is created in a `tmpdir` and cleaned up by the
 * caller. The fixture does not auto-cleanup because the test might
 * want to inspect the repo after failure.
 *
 * Implements ADR-014.
 */

export type GitFixture = {
  barePath: string
  fileUrl: string
  fileName: string
  fileContent: string
}

const FILE_NAME = "README.md"
const FILE_CONTENT = "# Test template\n"

export const createBareRepo = async (parentDir?: string): Promise<GitFixture> => {
  const baseDir = parentDir ?? (await mkdtemp(join(tmpdir(), "cli-e2e-")))
  const barePath = join(baseDir, "repo.git")

  // Initialise a bare repo with an explicit main branch.
  await execa("git", ["init", "--bare", "--initial-branch=main", barePath], {
    stdio: "ignore",
  })

  // Stage a commit in a temporary working tree, then push to the
  // bare repo on main.
  const workTree = await mkdtemp(join(tmpdir(), "cli-e2e-work-"))
  await writeFile(join(workTree, FILE_NAME), FILE_CONTENT, "utf8")
  await execa("git", ["init", "--initial-branch=main", workTree], {
    stdio: "ignore",
  })
  await execa("git", ["-C", workTree, "add", FILE_NAME])
  await execa("git", [
    "-C",
    workTree,
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@example.com",
    "commit",
    "-m",
    "initial",
  ])
  await execa("git", ["-C", workTree, "push", barePath, "main:main"], {
    stdio: "ignore",
  })

  // Convert the bare path to a file:// URL. Cross-platform: on
  // Windows, pathToFileURL produces a URL like
  // file:///C:/... instead of just file://C:/.... git accepts
  // either.
  const fileUrl = pathToFileURL(barePath).toString()

  return {
    barePath,
    fileUrl,
    fileName: FILE_NAME,
    fileContent: FILE_CONTENT,
  }
}

export const cleanup = async (fixture: GitFixture): Promise<void> => {
  // The fixture's temp dir is the parent of the bare path. We
  // remove the parent dir which removes the bare repo and the
  // working tree.
  const parentDir = fixture.barePath.split(sep).slice(0, -1).join(sep)
  await rm(parentDir, { recursive: true, force: true })
}
