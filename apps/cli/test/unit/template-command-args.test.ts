import { describe, expect, it } from "vitest"
import { normalizeTemplateCommandArgs } from "../../src/template-command-args.js"

describe("template command namespace", () => {
  it.each(["list", "info", "init"])(
    "dispatches templates %s to the shared handler",
    (command) => {
      expect(
        normalizeTemplateCommandArgs([
          "node",
          "deessejs",
          "templates",
          command,
          "value",
          "--json",
        ])
      ).toEqual(["node", "deessejs", command, "value", "--json"])
    }
  )

  it("keeps root command spellings unchanged", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "list", "--json"])
    ).toEqual(["node", "deessejs", "list", "--json"])
  })

  it("shows help for the empty namespace", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "templates"])
    ).toEqual(["node", "deessejs", "--help"])
  })

  it("shows the preferred namespace in templates help", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "templates", "--help"])
    ).toEqual(["node", "deessejs", "--help"])
  })
})
