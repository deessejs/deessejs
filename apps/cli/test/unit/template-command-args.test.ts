import { describe, expect, it } from "vitest"
import { normalizeTemplateCommandArgs } from "../../src/template-command-args.js"

describe("template command namespace", () => {
  it.each(["list", "info", "init"])(
    "dispatches template %s to the shared handler",
    (command) => {
      expect(
        normalizeTemplateCommandArgs([
          "node",
          "deessejs",
          "template",
          command,
          "value",
          "--json",
        ])
      ).toEqual(["node", "deessejs", "value", "--json"])
    }
  )

  it("does not translate root command spellings into the namespace", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "list", "--json"])
    ).toEqual(["node", "deessejs", "list", "--json"])
  })

  it("shows help for the empty namespace", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "template"])
    ).toEqual(["node", "deessejs", "--help"])
  })

  it("shows help for the legacy namespace alias", () => {
    expect(
      normalizeTemplateCommandArgs(["node", "deessejs", "templates", "--help"])
    ).toEqual(["node", "deessejs", "--help"])
  })

  it("dispatches the legacy templates alias to the shared handler", () => {
    expect(
      normalizeTemplateCommandArgs([
        "node",
        "deessejs",
        "templates",
        "list",
        "--json",
      ])
    ).toEqual(["node", "deessejs", "--json"])
  })
})
