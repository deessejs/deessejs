import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"
import plugin from "./project-type-rules.mjs"

function effectRule(filename, scope) {
  const reports = []
  const visitor = plugin.rules["no-raw-react-effects"].create({
    filename,
    sourceCode: { getScope: () => scope },
    report: (report) => reports.push(report),
  })
  return { visitor, reports }
}

function binding(name, definition) {
  return { set: new Map([[name, { defs: [definition] }]]), upper: null }
}

function callIdentifier(name) {
  return { type: "CallExpression", callee: { type: "Identifier", name } }
}

describe("project React effect rules", () => {
  it("requires project hooks that call hooks to live in the app hook directory", () => {
    const reports = []
    const visitor = plugin.rules["hooks-location"].create({
      filename: "/repo/apps/web/src/components/card.tsx",
      report: (report) => reports.push(report),
    })
    visitor.FunctionDeclaration({
      type: "FunctionDeclaration",
      id: { name: "useCardState" },
      body: { type: "BlockStatement", body: [{ type: "ExpressionStatement", expression: { type: "CallExpression", callee: { type: "Identifier", name: "useState" } } }] },
    })
    assert.equal(reports.length, 1)

    const allowed = plugin.rules["hooks-location"].create({
      filename: "/repo/apps/web/src/hooks/use-card-state.ts",
      report: (report) => reports.push(report),
    })
    assert.equal(Object.keys(allowed).length, 0)
    assert.equal(reports.length, 1)

    const dashboardAllowed = plugin.rules["hooks-location"].create({
      filename: "/repo/apps/app/hooks/use-card-state.ts",
      report: (report) => reports.push(report),
    })
    assert.equal(Object.keys(dashboardAllowed).length, 0)

    const wrongWebPath = plugin.rules["hooks-location"].create({
      filename: "/repo/apps/web/hooks/use-card-state.ts",
      report: (report) => reports.push(report),
    })
    assert.equal(typeof wrongWebPath.FunctionDeclaration, "function")
  })

  it("rejects named React effect imports", () => {
    const scope = binding("useEffect", {
      node: { type: "ImportSpecifier", imported: { name: "useEffect" } },
      parent: { source: { value: "react" } },
    })
    const { visitor, reports } = effectRule("/repo/apps/web/src/components/card.tsx", scope)
    visitor.CallExpression(callIdentifier("useEffect"))
    assert.equal(reports.length, 1)
  })

  it("recognizes aliased named imports", () => {
    const scope = binding("effect", {
      node: { type: "ImportSpecifier", imported: { name: "useEffect" } },
      parent: { source: { value: "react" } },
    })
    const { visitor, reports } = effectRule("/repo/apps/app/components/card.tsx", scope)
    visitor.CallExpression(callIdentifier("effect"))
    assert.equal(reports.length, 1)
  })

  it("recognizes a local alias of a namespace effect member", () => {
    const react = { defs: [{ node: { type: "ImportNamespaceSpecifier" }, parent: { source: { value: "react" } } }] }
    const scope = { set: new Map([["React", react]]), upper: null }
    const init = { type: "MemberExpression", computed: false, object: { type: "Identifier", name: "React" }, property: { type: "Identifier", name: "useEffect" } }
    const alias = { defs: [{ node: { type: "VariableDeclarator", init } }], scope }
    scope.set.set("effect", alias)
    const { visitor, reports } = effectRule("/repo/apps/web/src/components/card.tsx", scope)
    visitor.CallExpression(callIdentifier("effect"))
    assert.equal(reports.length, 1)
  })

  it("recognizes default React imports and static computed effect members", () => {
    const scope = binding("React", {
      node: { type: "ImportDefaultSpecifier" },
      parent: { source: { value: "react" } },
    })
    const { visitor, reports } = effectRule("/repo/apps/web/src/components/card.tsx", scope)
    visitor.CallExpression({ type: "CallExpression", callee: { type: "MemberExpression", computed: true, object: { type: "Identifier", name: "React" }, property: { type: "Literal", value: "useLayoutEffect" } } })
    assert.equal(reports.length, 1)
  })

  it("checks imported aliases and static member indirections with the Oxlint parser", async () => {
    const directory = await mkdtemp(join(process.cwd(), "apps/web/src/components/.react-effect-rule-"))
    const file = join(directory, "fixture.tsx")
    try {
      await writeFile(file, `import React from "react"\nimport * as R from "react"\nimport { useEffect as namedEffect } from "react"\nconst firstAlias = React.useEffect\nconst secondAlias = firstAlias\nfunction sample() { secondAlias(() => {}); namedEffect(() => {}); R["useLayoutEffect"](() => {}) }\nfunction shadowed(React: { useEffect: (fn: () => void) => void }) { React.useEffect(() => {}) }\n`)
      const oxlint = join(process.cwd(), "node_modules/.bin/oxlint")
      const result = spawnSync(oxlint, ["--config", ".oxlintrc.json", "--format", "json", file], { cwd: process.cwd(), encoding: "utf8" })
      assert.equal(result.error, undefined, result.error?.message)
      assert.notEqual(result.status, 0)
      const output = JSON.parse(result.stdout)
      const diagnostics = (output.diagnostics ?? []).filter((diagnostic) => diagnostic.code === "project(no-raw-react-effects)")
      assert.equal(diagnostics.length, 3, result.stderr || result.stdout)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("recognizes namespace imports and ignores a shadowed local", () => {
    const imported = { node: { type: "ImportNamespaceSpecifier" }, parent: { source: { value: "react" } } }
    const scope = { set: new Map([["React", { defs: [imported] }]]), upper: null }
    const { visitor, reports } = effectRule("/repo/apps/web/src/components/card.tsx", scope)
    visitor.CallExpression({ type: "CallExpression", callee: { type: "MemberExpression", computed: false, object: { type: "Identifier", name: "React" }, property: { type: "Identifier", name: "useLayoutEffect" } } })
    assert.equal(reports.length, 1)

    const shadowed = binding("React", { node: { type: "VariableDeclarator" } })
    const ignored = effectRule("/repo/apps/web/src/components/card.tsx", shadowed)
    ignored.visitor.CallExpression({ type: "CallExpression", callee: { type: "MemberExpression", computed: false, object: { type: "Identifier", name: "React" }, property: { type: "Identifier", name: "useEffect" } } })
    assert.equal(ignored.reports.length, 0)
  })

  it("allows raw effects only in app hook directories", () => {
    const scope = binding("useEffect", { node: { type: "ImportSpecifier", imported: { name: "useEffect" } }, parent: { source: { value: "react" } } })
    const { visitor, reports } = effectRule("/repo/apps/web/src/hooks/search/use-search.ts", scope)
    assert.equal(Object.keys(visitor).length, 0)
  })

  it("rejects the other frontend's hooks path and recognizes variable hook declarations", () => {
    const reports = []
    const visitor = plugin.rules["hooks-location"].create({
      filename: "/repo/apps/app/src/hooks/use-wrong-place.ts",
      report: (report) => reports.push(report),
    })
    visitor.VariableDeclarator({
      type: "VariableDeclarator",
      id: { name: "useWrongPlace" },
      init: { type: "ArrowFunctionExpression", body: { type: "CallExpression", callee: { type: "Identifier", name: "useState" } } },
    })
    assert.equal(reports.length, 1)

    visitor.MethodDefinition({
      type: "MethodDefinition",
      kind: "method",
      key: { name: "useAnotherState" },
      value: { body: { type: "BlockStatement", body: [{ type: "CallExpression", callee: { type: "Identifier", name: "useMemo" } }] } },
    })
    assert.equal(reports.length, 2)
  })
})
