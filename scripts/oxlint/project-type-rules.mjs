function countMembers(node) {
  if (node.type === "TSTypeLiteral") return node.members.length
  if (node.type === "TSInterfaceDeclaration") return node.body.body.length
  return 0
}

function containsInlineObjectType(node) {
  const pending = [node]
  const visited = new Set()

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || typeof current !== "object" || visited.has(current))
      continue
    visited.add(current)
    if (current.type === "TSTypeLiteral") return true

    for (const [key, value] of Object.entries(current)) {
      if (
        key === "parent" ||
        key === "loc" ||
        key === "range" ||
        key === "tokens" ||
        key === "comments"
      )
        continue
      if (Array.isArray(value)) pending.push(...value)
      else if (value && typeof value === "object") pending.push(value)
    }
  }

  return false
}

function checkNamedParameterTypes(context, node) {
  for (const parameter of node.params ?? []) {
    const target =
      parameter.type === "AssignmentPattern"
        ? parameter.left
        : parameter.type === "RestElement"
          ? parameter.argument
          : parameter
    if (
      target.typeAnnotation &&
      containsInlineObjectType(target.typeAnnotation.typeAnnotation)
    ) {
      context.report({
        node: target.typeAnnotation,
        message:
          "Extract inline object parameter types into a named type or interface.",
      })
    }
  }
}

function importedFromReact(variable) {
  return variable?.defs?.some((definition) => {
    const specifier = definition.node
    return specifier?.type === "ImportSpecifier" &&
      ["useEffect", "useLayoutEffect"].includes(specifier.imported?.name ?? specifier.imported?.value) &&
      (definition.parent?.source?.value ?? specifier.parent?.source?.value) === "react"
  }) ?? false
}

function resolveVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const found = current.set?.get(name)
    if (found) return found
  }
  return undefined
}

function isWithinHooksDirectory(filename) {
  return /(?:^|[/\\])apps[/\\](?:app|web)[/\\](?:src[/\\])?hooks[/\\]/.test(filename)
}

function hasHookCall(node) {
  let found = false
  const visit = (current) => {
    if (!current || found) return
    if (current.type === "CallExpression") {
      const callee = current.callee
      if ((callee.type === "Identifier" && /^use[A-Z0-9]/.test(callee.name)) ||
        (callee.type === "MemberExpression" && !callee.computed && /^use[A-Z0-9]/.test(callee.property.name))) found = true
    }
    for (const [key, value] of Object.entries(current)) {
      if (["parent", "loc", "range", "tokens", "comments"].includes(key)) continue
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === "object") visit(value)
    }
  }
  visit(node.body)
  return found
}

function isReactEffectCall(context, node) {
  const scope = context.sourceCode?.getScope?.(node) ?? context.getScope?.()
  const callee = node.callee
  if (callee.type === "Identifier") {
    return importedFromReact(resolveVariable(scope, callee.name))
  }
  if (callee.type === "MemberExpression" && !callee.computed && ["useEffect", "useLayoutEffect"].includes(callee.property.name) && callee.object.type === "Identifier") {
    const variable = resolveVariable(scope, callee.object.name)
    return variable?.defs?.some((definition) =>
      definition.node?.type === "ImportNamespaceSpecifier" &&
      (definition.parent?.source?.value ?? definition.node?.parent?.source?.value) === "react") ?? false
  }
  return false
}

const plugin = {
  meta: { name: "project-type-rules", version: "1.0.0" },
  rules: {
    "max-type-members": {
      meta: {
        type: "suggestion",
        schema: [{ type: "integer", minimum: 1 }],
        messages: {
          tooMany:
            "Type has {{actual}} members; the maximum is {{maximum}}. Compose smaller types instead.",
        },
      },
      create(context) {
        const maximum = context.options[0] ?? 6
        return {
          TSTypeLiteral(node) {
            reportMemberCount(context, node, maximum)
          },
          TSInterfaceDeclaration(node) {
            reportMemberCount(context, node, maximum)
          },
        }
      },
    },
    "named-parameter-types": {
      meta: {
        type: "suggestion",
        schema: [],
        messages: {
          inline:
            "Extract inline object parameter types into a named type or interface.",
        },
      },
      create(context) {
        return {
          FunctionDeclaration: (node) =>
            checkNamedParameterTypes(context, node),
          FunctionExpression: (node) => checkNamedParameterTypes(context, node),
          ArrowFunctionExpression: (node) =>
            checkNamedParameterTypes(context, node),
          TSDeclareFunction: (node) => checkNamedParameterTypes(context, node),
          TSMethodSignature: (node) => checkNamedParameterTypes(context, node),
          TSFunctionType: (node) => checkNamedParameterTypes(context, node),
          TSConstructorType: (node) => checkNamedParameterTypes(context, node),
        }
      },
    },
    "no-raw-react-effects": {
      meta: { type: "problem", schema: [], messages: { raw: "Move React effect synchronization into a purpose-specific hook under the app hooks directory." } },
      create(context) {
        const filename = context.filename ?? context.getFilename?.()
        if (!/(?:^|[/\\])apps[/\\](?:app|web)[/\\]/.test(filename) || isWithinHooksDirectory(filename)) return {}
        return { CallExpression(node) { if (isReactEffectCall(context, node)) context.report({ node, messageId: "raw" }) } }
      },
    },
    "hooks-location": {
      meta: { type: "problem", schema: [], messages: { location: "Project-defined hooks that call hooks must live under the app hooks directory." } },
      create(context) {
        const filename = context.filename ?? context.getFilename?.()
        if (!/(?:^|[/\\])apps[/\\](?:app|web)[/\\]/.test(filename) || isWithinHooksDirectory(filename)) return {}
        const check = (node, name) => {
          if (name && /^use[A-Z0-9]/.test(name) && hasHookCall(node)) context.report({ node, messageId: "location" })
        }
        return {
          FunctionDeclaration(node) { check(node, node.id?.name) },
          VariableDeclarator(node) { if (["ArrowFunctionExpression", "FunctionExpression"].includes(node.init?.type)) check(node.init, node.id?.name) },
        }
      },
    },
  },
}

function reportMemberCount(context, node, maximum) {
  const actual = countMembers(node)
  if (actual > maximum) {
    context.report({
      node,
      message: `Type has ${actual} members; the maximum is ${maximum}. Compose smaller types instead.`,
    })
  }
}

export default plugin
