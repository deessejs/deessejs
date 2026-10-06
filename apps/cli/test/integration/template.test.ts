/**
 * End-to-end integration tests for `deessejs template <validate
 * | new | explain>`.
 *
 * `validate` is the only subcommand with a functional
 * implementation in this PR (per ADR-034). `new` and `explain`
 * are honest placeholders that throw with a pointer to their
 * ADR. We exercise both behaviours:
 *
 *   - `validate <path>` round-trips a tmpdir-hosted descriptor
 *     file through the real TemplateV2 Zod schema. Exit 0 on
 *     success, non-zero on failure.
 *   - `validate --json` emits machine-readable output.
 *   - `new <slug>` and `explain <field>` return the placeholder
 *     error message.
 */

import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { TemplateV2 } from "@workspace/contracts/v2"

import { cleanupSandbox, makeSandbox, withCwd, withEnv } from "./_sandbox.js"
import { invoke } from "./_invoke.js"

const VALID_DESCRIPTOR = TemplateV2.parse({
  $schema: "https://registry.deessejs.com/schema/template/v2.json",
  name: "test-template",
  title: "Test Template",
  type: "template:app",
  version: "0.1.0",
  author: "Test Author <test@example.com>",
  source: { repo: "deessejs/test-template", ref: "main" },
  requires: { runtime: "node" },
  files: [
    {
      path: "package.json",
      type: "template:config",
    },
  ],
})

describe("deessejs template (integration)", () => {
  let sandbox: string

  beforeEach(() => {
    sandbox = makeSandbox("template")
  })

  afterEach(() => {
    cleanupSandbox(sandbox)
  })

  it("validate accepts a well-formed descriptor (exit 0)", async () => {
    const path = join(sandbox, "deesse-template.json")
    writeFileSync(path, JSON.stringify(VALID_DESCRIPTOR, null, 2))

    await expect(
      withCwd(sandbox, async () =>
        invoke({
          cwd: sandbox,
          args: ["template", "validate", path],
        }),
      ),
    ).resolves.toBeDefined()
  })

  it("validate rejects a closed-list type violation (exit 1)", async () => {
    const invalid = { ...VALID_DESCRIPTOR, type: "template:other" }
    const path = join(sandbox, "deesse-template.json")
    writeFileSync(path, JSON.stringify(invalid))

    let capturedStdout = ""
    let exitCode = -1
    try {
      await withCwd(sandbox, async () =>
        invoke({
          cwd: sandbox,
          args: ["template", "validate", path],
        }),
      )
    } catch (err) {
      capturedStdout = (err as { stdout?: string }).stdout ?? ""
      exitCode = (err as { exitCode?: number }).exitCode ?? -1
    }

    // `validate` is a read-only command: it prints the human-
    // readable error to stdout (per validate.ts), then exits
    // non-zero. The exit code being non-zero is the load-
    // bearing assertion; the message shape is asserted in the
    // unit test.
    expect(capturedStdout).toMatch(/validation/i)
    expect(exitCode).not.toBe(0)
  })

  it("validate surfaces a clean 'does not exist' message (not 'unexpected internal error')", async () => {
    // Regression: the last-resort error handler in `src/index.ts`
    // used to format any CliError as `Internal error: <message>`,
    // hiding the structured Error/Hint/Code from the user. After
    // the fix that branches on `instanceof CliError`, the user
    // should see the proper message — here, "does not exist" —
    // not the generic wrapper. `validate` writes the message to
    // stdout (not stderr) before exiting — see apps/cli/src/
    // commands/template/validate.ts.
    let capturedStdout = ""
    let capturedStderr = ""
    try {
      await withCwd(sandbox, async () =>
        invoke({
          cwd: sandbox,
          args: ["template", "validate"], // no path → defaults to ./deesse-template.json
        }),
      )
    } catch (err) {
      capturedStdout = (err as { stdout?: string }).stdout ?? ""
      capturedStderr = (err as { stderr?: string }).stderr ?? ""
    }
    const combined = capturedStdout + capturedStderr
    expect(combined).toContain("does not exist")
    expect(combined).not.toContain("unexpected internal error")
  })

  it("validate --json emits machine-readable error output", async () => {
    const invalid = { ...VALID_DESCRIPTOR, type: "bogus" }
    const path = join(sandbox, "deesse-template.json")
    writeFileSync(path, JSON.stringify(invalid))

    let captured = ""
    try {
      await withEnv(
        {
          DEESSEJS_CLI_CAPTURE_STDOUT: "1",
        },
        async () =>
          withCwd(sandbox, async () =>
            invoke({
              cwd: sandbox,
              args: ["template", "validate", "--json", path],
            }),
          ),
      )
    } catch (err) {
      captured = (err as { stdout?: string }).stdout ?? ""
    }

    // `validate --json` writes the payload to stdout, then exits
    // non-zero. The shape of the JSON is what we care about.
    expect(captured).toContain('"ok": false')
  })

  it("new exits with the 'not yet implemented' message", async () => {
    await expect(
      withCwd(sandbox, async () =>
        invoke({
          cwd: sandbox,
          args: ["template", "new", "auth-addon"],
        }),
      ),
    ).rejects.toThrow(/not yet implemented.*ADR-034/)
  })

  it("explain exits with the 'not yet implemented' message", async () => {
    await expect(
      withCwd(sandbox, async () =>
        invoke({
          cwd: sandbox,
          args: ["template", "explain", "files[].type"],
        }),
      ),
    ).rejects.toThrow(/not yet implemented.*ADR-034/)
  })
})