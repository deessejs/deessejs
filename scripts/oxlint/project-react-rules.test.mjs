import assert from "node:assert/strict"
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

  it("recognizes namespace imports and ignores a shadowed local", () => {
    const imported = { node: { type: "ImportNamespaceSpecifier" }, parent: { source: { value: "react" } } }
    const scope = { set: new Map([["React", { defs: [imported] }]]), upper: null }
    const { visitor, reports } = effectRule("/repo/apps/web/src/components/card.tsx", scope)
    visitor.CallExpression({ type: "CallExpression", callee: { type: "MemberExpression", computed: false, object: { type: "Identifier", name: "React" }, property: { name: "useLayoutEffect" } } })
    assert.equal(reports.length, 1)

    const shadowed = binding("React", { node: { type: "VariableDeclarator" } })
    const ignored = effectRule("/repo/apps/web/src/components/card.tsx", shadowed)
    ignored.visitor.CallExpression({ type: "CallExpression", callee: { type: "MemberExpression", computed: false, object: { type: "Identifier", name: "React" }, property: { name: "useEffect" } } })
    assert.equal(ignored.reports.length, 0)
  })

  it("allows raw effects only in app hook directories", () => {
    const scope = binding("useEffect", { node: { type: "ImportSpecifier", imported: { name: "useEffect" } }, parent: { source: { value: "react" } } })
    const { visitor, reports } = effectRule("/repo/apps/web/src/hooks/search/use-search.ts", scope)
    assert.equal(Object.keys(visitor).length, 0)
  })
})
