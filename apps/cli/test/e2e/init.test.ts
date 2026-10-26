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
  "@deessejs/cli: packed init regression (Linux consumer)",
  () => {
    let workDirectory = ""
    let consumerDirectory = ""
    let installDirectory = ""
    let fixtureBinDirectory = ""
    let cliExecutable = ""
    let tarballPath = ""
    let fetchTracePath = ""

    beforeAll(async () => {
      workDirectory = mkdtempSync(join(tmpdir(), "deessejs-cli-init-e2e-"))
      consumerDirectory = join(workDirectory, "consumer")
      installDirectory = join(workDirectory, "install")
      fixtureBinDirectory = join(workDirectory, "bin")
      fetchTracePath = join(workDirectory, "fetch-trace.log")
      mkdirSync(consumerDirectory, { recursive: true })
      mkdirSync(installDirectory, { recursive: true })
      mkdirSync(fixtureBinDirectory, { recursive: true })

      // If the descriptor path regresses into the Git clone fallback,
      // make the test fail without allowing a real GitHub network call.
      writeExecutable(
        join(fixtureBinDirectory, "git"),
        "#!/bin/sh\necho 'git must not run for a valid descriptor' >&2\nexit 97\n"
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
          DEESSEJS_INIT_FIXTURE_DIRECTORY: templateFixtureDirectory,
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
        expect(installResult.stdout).toContain("Template ready")
        expect(
          existsSync(join(installedProjectDirectory, "pnpm-lock.yaml"))
        ).toBe(true)

        const requests = readFileSync(fetchTracePath, "utf8").trim().split("\n")
        expect(requests).toContain(
          "GET https://app.deessejs.com/api/v1/version"
        )
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
          `GET https://api.github.com/repos/deessejs/init-regression-fixture/git/trees/${expectedRevision}?recursive=1`
        )
        expect(requests).toHaveLength(18)
      },
      3 * 60_000
    )
  }
)
