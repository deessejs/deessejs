import { execFile } from "node:child_process"
import { promisify } from "node:util"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import * as tar from "tar"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const cliDirectory = resolve(import.meta.dirname, "../..")
const templateFixtureDirectory = join(
  import.meta.dirname,
  "fixtures",
  "template"
)
const mockFetchPath = join(
  import.meta.dirname,
  "fixtures",
  "mock-runtime-fetch.mjs"
)
const expectedRevision = "0123456789abcdef0123456789abcdef01234567"
const missingDescriptorRevision = "9876543210abcdef9876543210abcdef98765432"

type CommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}

const runCommand = async (
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv; timeout: number }
): Promise<CommandResult> => {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      encoding: "utf8",
      timeout: options.timeout,
      maxBuffer: 10 * 1024 * 1024,
    })
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    const result = error as Error & {
      code?: number | string
      stdout?: string
      stderr?: string
    }
    return {
      exitCode: typeof result.code === "number" ? result.code : 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? result.message,
    }
  }
}

const writeExecutable = (path: string, contents: string): void => {
  writeFileSync(path, contents)
  chmodSync(path, 0o755)
}

describe.skipIf(process.platform !== "linux")(
  "@deessejs/cli: packed init and info regressions (Linux consumer)",
  () => {
    let workDirectory = ""
    let consumerDirectory = ""
    let installDirectory = ""
    let fixtureBinDirectory = ""
    let cliExecutable = ""
    let tarballPath = ""
    let templateArchivePath = ""
    let missingDescriptorArchivePath = ""
    let fetchTracePath = ""

    beforeAll(async () => {
      workDirectory = mkdtempSync(join(tmpdir(), "deessejs-cli-init-e2e-"))
      consumerDirectory = join(workDirectory, "consumer")
      installDirectory = join(workDirectory, "install")
      fixtureBinDirectory = join(workDirectory, "bin")
      fetchTracePath = join(workDirectory, "fetch-trace.log")
      templateArchivePath = join(workDirectory, "template-fixture.tar.gz")
      missingDescriptorArchivePath = join(
        workDirectory,
        "missing-descriptor-fixture.tar.gz"
      )
      mkdirSync(consumerDirectory, { recursive: true })
      mkdirSync(installDirectory, { recursive: true })
      mkdirSync(fixtureBinDirectory, { recursive: true })
      await tar.c(
        {
          cwd: templateFixtureDirectory,
          file: templateArchivePath,
          gzip: true,
          prefix: `deessejs-init-regression-fixture-${expectedRevision.slice(0, 7)}`,
        },
        [".gitignore", "deesse-template.json", "package.json", "private", "src"]
      )
      await tar.c(
        {
          cwd: templateFixtureDirectory,
          file: missingDescriptorArchivePath,
          gzip: true,
          prefix: `deessejs-legacy-template-${missingDescriptorRevision.slice(0, 7)}`,
        },
        [".gitignore", "package.json", "private", "src"]
      )

      // If any descriptor-backed init regresses into Git cloning, make the
      // test fail without allowing a real GitHub network call.
      writeExecutable(
        join(fixtureBinDirectory, "git"),
        "#!/bin/sh\necho 'git must not run for a valid descriptor' >&2\nexit 97\n"
      )
      writeExecutable(
        join(fixtureBinDirectory, "npm"),
        "#!/bin/sh\necho 'PACKAGE_MANAGER_STDOUT_SENTINEL'\necho 'PACKAGE_MANAGER_STDERR_SENTINEL' >&2\nexit 0\n"
      )

      const packResult = await runCommand(
        "pnpm",
        ["--dir", cliDirectory, "pack", "--pack-destination", installDirectory],
        { cwd: resolve(cliDirectory, "../.."), timeout: 5 * 60_000 }
      )
      if (packResult.exitCode !== 0) {
        throw new Error(
          `pnpm pack failed: ${packResult.stdout}\n${packResult.stderr}`
        )
      }

      const tarballs = readdirSync(installDirectory).filter((name) =>
        name.endsWith(".tgz")
      )
      if (tarballs.length !== 1) {
        throw new Error(
          `Expected one CLI tarball, found ${tarballs.length}: ${tarballs.join(", ")}`
        )
      }
      tarballPath = join(installDirectory, tarballs[0] as string)

      writeFileSync(
        join(consumerDirectory, "package.json"),
        JSON.stringify(
          { name: "deessejs-cli-e2e-consumer", private: true },
          null,
          2
        )
      )
      const npmInstallResult = await runCommand(
        "npm",
        ["install", "--no-audit", "--no-fund", tarballPath],
        { cwd: consumerDirectory, timeout: 5 * 60_000 }
      )
      if (npmInstallResult.exitCode !== 0) {
        throw new Error(
          `npm install of packed CLI failed: ${npmInstallResult.stdout}\n${npmInstallResult.stderr}`
        )
      }

      cliExecutable = join(
        consumerDirectory,
        "node_modules",
        ".bin",
        "deessejs"
      )
    }, 10 * 60_000)

    afterAll(() => {
      if (workDirectory) rmSync(workDirectory, { recursive: true, force: true })
    })

    it(
      "creates and installs the descriptor-selected project from the packed CLI",
      async () => {
        const projectDirectory = join(consumerDirectory, "generated-project")
        expect(
          existsSync(projectDirectory),
          `project directory unexpectedly exists before init: ${readdirSync(consumerDirectory).join(", ")}`
        ).toBe(false)
        const env = {
          ...process.env,
          DEESSEJS_INIT_FIXTURE_ARCHIVE: templateArchivePath,
          DEESSEJS_INIT_FIXTURE_DESCRIPTOR: join(
            templateFixtureDirectory,
            "deesse-template.json"
          ),
          DEESSEJS_INIT_MISSING_DESCRIPTOR_ARCHIVE:
            missingDescriptorArchivePath,
          DEESSEJS_INIT_FETCH_TRACE: fetchTracePath,
          NODE_OPTIONS: [
            process.env.NODE_OPTIONS,
            `--import=${pathToFileURL(mockFetchPath).href}`,
          ]
            .filter(Boolean)
            .join(" "),
          PATH: `${fixtureBinDirectory}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`,
        }

        const noInstallResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            projectDirectory,
            "--no-install",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )

        expect(
          noInstallResult.exitCode,
          `${noInstallResult.stdout}\n${noInstallResult.stderr}`
        ).toBe(0)
        const parsed = JSON.parse(noInstallResult.stdout) as {
          ok: boolean
          slug: string
          dir: string
          ref: string
          installed: boolean
        }
        expect(parsed).toMatchObject({
          ok: true,
          slug: "init-regression-fixture",
          dir: projectDirectory,
          ref: expectedRevision,
          installed: false,
        })

        const catalogInfoResult = await runCommand(
          cliExecutable,
          ["info", "init-regression-fixture"],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(
          catalogInfoResult.exitCode,
          `${catalogInfoResult.stdout}\n${catalogInfoResult.stderr}`
        ).toBe(0)
        expect(catalogInfoResult.stdout).not.toContain("Catalog")
        expect(catalogInfoResult.stdout).toContain("Template descriptor")
        expect(catalogInfoResult.stdout).toContain("template:app")
        expect(catalogInfoResult.stdout).toContain("1.0.0")

        const catalogJsonInfoResult = await runCommand(
          cliExecutable,
          ["info", "init-regression-fixture", "--json"],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(catalogJsonInfoResult.exitCode).toBe(0)
        expect(catalogInfoResult.stdout).toContain(
          "Install: deessejs init init-regression-fixture"
        )

        const unknownCatalogInfoResult = await runCommand(
          cliExecutable,
          ["info", "test", "--json"],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(unknownCatalogInfoResult.exitCode).not.toBe(0)
        const unknownCatalogInfo = JSON.parse(unknownCatalogInfoResult.stdout)
        expect(unknownCatalogInfo).toMatchObject({
          ok: false,
          code: "not_found",
        })
        expect(unknownCatalogInfo.message).toContain(
          'template "test" not found'
        )

        const directInfoResult = await runCommand(
          cliExecutable,
          [
            "info",
            "https://github.com/deessejs/init-regression-fixture",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(
          directInfoResult.exitCode,
          `${directInfoResult.stdout}\n${directInfoResult.stderr}`
        ).toBe(0)
        const directInfo = JSON.parse(directInfoResult.stdout)
        expect(directInfo).toMatchObject({
          descriptor: {
            name: "CLI init regression fixture",
            type: "template:app",
            version: "1.0.0",
          },
          source: {
            repository: "deessejs/init-regression-fixture",
          },
        })
        expect(directInfo).toEqual(JSON.parse(catalogJsonInfoResult.stdout))

        const directHumanInfoResult = await runCommand(
          cliExecutable,
          [
            "info",
            "https://github.com/deessejs/init-regression-fixture",
            "--ref",
            "main",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(directHumanInfoResult.exitCode).toBe(0)
        expect(directHumanInfoResult.stdout).not.toContain("Catalog")
        expect(directHumanInfoResult.stdout.split("\n\nInstall:")[0]).toBe(
          catalogInfoResult.stdout.split("\n\nInstall:")[0]
        )

        expect(readFileSync(join(projectDirectory, ".gitignore"), "utf8")).toBe(
          "node_modules\n.env\n"
        )
        expect(
          readFileSync(join(projectDirectory, "src", "index.js"), "utf8")
        ).toBe('export const generatedProject = "created by deessejs init"\n')
        expect(existsSync(join(projectDirectory, "deesse-template.json"))).toBe(
          false
        )
        expect(
          existsSync(join(projectDirectory, "private", "secret.txt"))
        ).toBe(false)

        const installedProjectDirectory = join(
          consumerDirectory,
          "installed-project"
        )
        const installResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            installedProjectDirectory,
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(
          installResult.exitCode,
          `${installResult.stdout}\n${installResult.stderr}`
        ).toBe(0)
        const installOutput = `${installResult.stdout}\n${installResult.stderr}`
        expect(installOutput).toContain("Initializing init-regression-fixture")
        expect(installOutput).toContain("Template downloaded")
        expect(installOutput).toContain("Project files created")
        expect(installOutput).toContain("Dependencies installed")
        expect(installOutput).toContain("Next steps")
        expect(installOutput).not.toContain("PACKAGE_MANAGER_")
        expect(
          existsSync(join(installedProjectDirectory, "pnpm-lock.yaml"))
        ).toBe(true)

        const quietProjectDirectory = join(
          consumerDirectory,
          "quiet-output-project"
        )
        const quietResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            quietProjectDirectory,
            "--pm",
            "npm",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(quietResult.exitCode).toBe(0)
        expect(`${quietResult.stdout}\n${quietResult.stderr}`).not.toContain(
          "PACKAGE_MANAGER_"
        )

        const noInstallVerboseDirectory = join(
          consumerDirectory,
          "no-install-verbose-project"
        )
        const noInstallVerboseResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            noInstallVerboseDirectory,
            "--no-install",
            "--verbose",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        const noInstallVerboseOutput = `${noInstallVerboseResult.stdout}\n${noInstallVerboseResult.stderr}`
        expect(noInstallVerboseResult.exitCode).toBe(0)
        expect(noInstallVerboseOutput).toContain("[verbose] Template source:")
        expect(noInstallVerboseOutput).toContain(
          "[verbose] Source repository: https://github.com/"
        )
        expect(noInstallVerboseOutput).toContain(
          "[verbose] Requested ref: default branch"
        )
        expect(noInstallVerboseOutput).toContain(
          `[verbose] Target directory: ${noInstallVerboseDirectory}`
        )
        expect(noInstallVerboseOutput).toContain("[verbose] Resolved commit:")
        expect(noInstallVerboseOutput).toContain(
          "[verbose] Files selected by deesse-template.json:"
        )
        expect(noInstallVerboseOutput).toContain(
          "[verbose] Dependency installation skipped (--no-install)"
        )
        expect(noInstallVerboseOutput).not.toContain("PACKAGE_MANAGER_")
        expect(noInstallVerboseOutput).not.toContain("\\n")

        const verboseProjectDirectory = join(
          consumerDirectory,
          "verbose-output-project"
        )
        const verboseResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            verboseProjectDirectory,
            "--pm",
            "npm",
            "--verbose",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        const verboseOutput = `${verboseResult.stdout}\n${verboseResult.stderr}`
        expect(verboseResult.exitCode).toBe(0)
        expect(verboseOutput).toContain("PACKAGE_MANAGER_STDOUT_SENTINEL")
        expect(verboseOutput).toContain("PACKAGE_MANAGER_STDERR_SENTINEL")

        const verboseJsonProjectDirectory = join(
          consumerDirectory,
          "verbose-json-output-project"
        )
        const verboseJsonResult = await runCommand(
          cliExecutable,
          [
            "init",
            "init-regression-fixture",
            "--dir",
            verboseJsonProjectDirectory,
            "--pm",
            "npm",
            "--verbose",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(verboseJsonResult.exitCode).toBe(0)
        expect(JSON.parse(verboseJsonResult.stdout)).toMatchObject({ ok: true })
        expect(verboseJsonResult.stdout).not.toContain("PACKAGE_MANAGER_")
        expect(verboseJsonResult.stderr).toContain("PACKAGE_MANAGER_")

        const directProjectDirectory = join(
          consumerDirectory,
          "direct-github-project"
        )
        const directResult = await runCommand(
          cliExecutable,
          [
            "init",
            "https://github.com/deessejs/init-regression-fixture",
            "--dir",
            directProjectDirectory,
            "--no-install",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(
          directResult.exitCode,
          `${directResult.stdout}\n${directResult.stderr}`
        ).toBe(0)
        expect(JSON.parse(directResult.stdout)).toMatchObject({
          ok: true,
          slug: "init-regression-fixture",
          dir: directProjectDirectory,
          ref: expectedRevision,
          installed: false,
        })
        expect(
          readFileSync(join(directProjectDirectory, "src", "index.js"), "utf8")
        ).toBe('export const generatedProject = "created by deessejs init"\n')

        const unsupportedCatalogResult = await runCommand(
          cliExecutable,
          [
            "init",
            "legacy-starter",
            "--dir",
            join(consumerDirectory, "unsupported-catalog-project"),
            "--no-install",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(unsupportedCatalogResult.exitCode).not.toBe(0)
        expect(JSON.parse(unsupportedCatalogResult.stdout)).toMatchObject({
          ok: false,
          code: "template_invalid",
        })
        expect(unsupportedCatalogResult.stdout).toContain(
          "deesse-template.json"
        )

        const unsupportedInfoResult = await runCommand(
          cliExecutable,
          ["info", "legacy-starter", "--json"],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(unsupportedInfoResult.exitCode).not.toBe(0)
        expect(JSON.parse(unsupportedInfoResult.stdout)).toMatchObject({
          ok: false,
          code: "template_invalid",
        })
        expect(unsupportedInfoResult.stdout).toContain("deesse-template.json")

        const missingRepositoryInfoResult = await runCommand(
          cliExecutable,
          [
            "info",
            "https://github.com/deessejs/missing-template-repository",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(missingRepositoryInfoResult.exitCode).not.toBe(0)
        expect(JSON.parse(missingRepositoryInfoResult.stdout)).toMatchObject({
          ok: false,
          code: "not_found",
        })
        expect(missingRepositoryInfoResult.stdout).toContain("was not found")

        const unsupportedUrlResult = await runCommand(
          cliExecutable,
          [
            "init",
            "https://github.com/deessejs/legacy-template",
            "--dir",
            join(consumerDirectory, "unsupported-url-project"),
            "--no-install",
            "--json",
          ],
          { cwd: consumerDirectory, env, timeout: 2 * 60_000 }
        )
        expect(unsupportedUrlResult.exitCode).not.toBe(0)
        expect(JSON.parse(unsupportedUrlResult.stdout)).toMatchObject({
          ok: false,
          code: "template_invalid",
        })
        expect(unsupportedUrlResult.stdout).toContain("deesse-template.json")

        const requests = readFileSync(fetchTracePath, "utf8").trim().split("\n")
        expect(requests).toContain(
          "GET https://app.deessejs.com/api/v1/version"
        )
        expect(
          requests.filter((request) =>
            request.startsWith("GET https://app.deessejs.com/api/v1/version")
          )
        ).toHaveLength(7)
        expect(requests).toContain(
          "POST https://app.deessejs.com/api/v1/rpc/templates/list"
        )
        expect(requests).toContain(
          "GET https://api.github.com/repos/deessejs/init-regression-fixture"
        )
        expect(requests).toContain(
          `GET https://api.github.com/repos/deessejs/init-regression-fixture/commits/main`
        )
        expect(requests).toContain(
          `GET https://api.github.com/repos/deessejs/init-regression-fixture/tarball/${expectedRevision}`
        )
        expect(
          requests.some(
            (request) =>
              request.includes("/git/trees/") || request.includes("/git/blobs/")
          )
        ).toBe(false)
        expect(
          requests.filter((request) => request.includes("/tarball/")).length
        ).toBe(9)
        expect(
          requests.filter((request) =>
            request.includes(
              "POST https://app.deessejs.com/api/v1/rpc/templates/list"
            )
          ).length
        ).toBe(11)
        expect(
          requests.filter((request) =>
            request.startsWith(
              "POST https://app.deessejs.com/api/v1/rpc/templates/resolve"
            )
          )
        ).toHaveLength(4)
        expect(requests).toContain(
          `GET https://api.github.com/repos/deessejs/legacy-template/tarball/${missingDescriptorRevision}`
        )
        expect(
          requests.filter((request) =>
            request.includes(
              `GET https://api.github.com/repos/deessejs/legacy-template/tarball/${missingDescriptorRevision}`
            )
          )
        ).toHaveLength(2)
        expect(
          requests.filter((request) =>
            request.startsWith(
              "GET https://api.github.com/repos/deessejs/init-regression-fixture/contents/deesse-template.json"
            )
          )
        ).toHaveLength(4)
        expect(requests).toContain(
          "GET https://api.github.com/repos/deessejs/legacy-template/contents/deesse-template.json"
        )
      },
      3 * 60_000
    )
  }
)
