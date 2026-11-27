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

function resolveVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const found = current.set?.get(name)
    if (found) return found
  }
  return undefined
}

function importedFromReact(variable, importedNames) {
  return (
    variable?.defs?.some((definition) => {
      const specifier = definition.node
      if (
        (definition.parent?.source?.value ??
          specifier?.parent?.source?.value) !== "react"
      )
        return false
      if (
        specifier?.type === "ImportNamespaceSpecifier" ||
        specifier?.type === "ImportDefaultSpecifier"
      )
        return true
      return (
        specifier?.type === "ImportSpecifier" &&
        importedNames.includes(
          specifier.imported?.name ?? specifier.imported?.value
        )
      )
    }) ?? false
  )
}

function appHooksDirectory(filename) {
  const normalized = filename.replaceAll("\\", "/")
  if (/(?:^|\/)apps\/web\//.test(normalized)) return "apps/web/src/hooks/"
  if (/(?:^|\/)apps\/app\//.test(normalized)) return "apps/app/hooks/"
  return null
}

function isWithinHooksDirectory(filename) {
  const normalized = filename.replaceAll("\\", "/")
  const expected = appHooksDirectory(normalized)
  return (
    expected !== null &&
    new RegExp(`(?:^|/)${expected.replaceAll("/", "\\/")}`).test(normalized)
  )
}

function hasHookCall(node) {
  let found = false
  const visit = (current) => {
    if (!current || found) return
    if (current.type === "CallExpression") {
      const callee = current.callee
      if (
        (callee.type === "Identifier" && /^use[A-Z0-9]/.test(callee.name)) ||
        (callee.type === "MemberExpression" &&
          !callee.computed &&
          /^use[A-Z0-9]/.test(callee.property.name))
      )
        found = true
    }
    for (const [key, value] of Object.entries(current)) {
      if (["parent", "loc", "range", "tokens", "comments"].includes(key))
        continue
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === "object") visit(value)
    }
  }
  visit(node.body)
  return found
}

function memberName(expression) {
  if (!expression.computed && expression.property.type === "Identifier")
    return expression.property.name
  if (
    expression.computed &&
    expression.property.type === "Literal" &&
    typeof expression.property.value === "string"
  )
    return expression.property.value
  return null
}

function isReactNamespaceVariable(variable, scope, visited) {
  if (!variable || visited.has(variable)) return false
  visited.add(variable)
  if (importedFromReact(variable, [])) return true
  return (
    variable.defs?.some((definition) => {
      const declarator = definition.node
      if (
        declarator?.type !== "VariableDeclarator" ||
        declarator.init?.type !== "Identifier"
      )
        return false
      const declarationScope = variable.scope ?? scope
      return isReactNamespaceVariable(
        resolveVariable(declarationScope, declarator.init.name),
        declarationScope,
        visited
      )
    }) ?? false
  )
}

function isEffectVariable(variable, scope, visited = new Set()) {
  if (!variable || visited.has(variable)) return false
  visited.add(variable)
  if (importedFromReact(variable, ["useEffect", "useLayoutEffect"])) return true
  return (
    variable.defs?.some((definition) => {
      const declarator = definition.node
      if (declarator?.type !== "VariableDeclarator" || !declarator.init)
        return false
      const declarationScope = variable.scope ?? scope
      const init = declarator.init
      if (init.type === "Identifier") {
        return isEffectVariable(
          resolveVariable(declarationScope, init.name),
          declarationScope,
          visited
        )
      }
      if (
        init.type === "MemberExpression" &&
        ["useEffect", "useLayoutEffect"].includes(memberName(init))
      ) {
        return (
          init.object.type === "Identifier" &&
          isReactNamespaceVariable(
            resolveVariable(declarationScope, init.object.name),
            declarationScope,
            new Set()
          )
        )
      }
      return false
    }) ?? false
  )
}

function isReactEffectCall(context, node) {
  const scope = context.sourceCode?.getScope?.(node) ?? context.getScope?.()
  const callee = node.callee
  if (callee.type === "Identifier")
    return isEffectVariable(resolveVariable(scope, callee.name), scope)
  if (
    callee.type === "MemberExpression" &&
    ["useEffect", "useLayoutEffect"].includes(memberName(callee)) &&
    callee.object.type === "Identifier"
  ) {
    return isReactNamespaceVariable(
      resolveVariable(scope, callee.object.name),
      scope,
      new Set()
    )
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
    "tanstack-form-required": {
      meta: {
        type: "problem",
        schema: [],
        docs: {
          description:
            "Require TanStack Form for app-managed forms. A native form is allowed only with an action prop that references a server action and no client onSubmit handler.",
        },
      },
      create(context) {
        const useFormNames = new Set()
        const functionScopes = []

        function enterFunction(node) {
          functionScopes.push({ node, usesTanStackForm: false })
        }

        function leaveFunction() {
          functionScopes.pop()
        }

        return {
          ImportDeclaration(node) {
            if (node.source.value !== "@tanstack/react-form") return
            for (const specifier of node.specifiers) {
              if (
                specifier.type === "ImportSpecifier" &&
                specifier.imported.name === "useForm"
              ) {
                useFormNames.add(specifier.local.name)
              }
            }
          },
          FunctionDeclaration: enterFunction,
          "FunctionDeclaration:exit": leaveFunction,
          FunctionExpression: enterFunction,
          "FunctionExpression:exit": leaveFunction,
          ArrowFunctionExpression: enterFunction,
          "ArrowFunctionExpression:exit": leaveFunction,
          CallExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              useFormNames.has(node.callee.name)
            ) {
              const currentScope = functionScopes.at(-1)
              if (currentScope) currentScope.usesTanStackForm = true
            }
          },
          JSXOpeningElement(node) {
            if (
              node.name.type !== "JSXIdentifier" ||
              node.name.name !== "form"
            ) {
              return
            }

            const currentScope = functionScopes.at(-1)
            if (currentScope?.usesTanStackForm || isServerActionForm(node)) {
              return
            }

            context.report({
              node: node.name,
              message:
                "Use @tanstack/react-form for app-managed forms. Native forms are allowed only for server actions via action={serverAction}, without a client onSubmit handler.",
            })
          },
        }
      },
    },
    "no-raw-jsx-anchor": {
      meta: {
        type: "problem",
        schema: [],
        docs: {
          description:
            "Require next/link in the Next.js apps. Preserve native anchors in the two Markdown renderers because they render content-provided links, and for the customer notification mailto handoff because it launches the user's email client.",
        },
        messages: {
          raw: "Use <Link /> from next/link for navigation and external URLs.",
        },
      },
      create(context) {
        const filename = (
          context.filename ??
          context.getFilename?.() ??
          ""
        ).replaceAll("\\", "/")
        const isMarkdownLinkRenderer = [
          "/apps/web/src/components/templates/template-readme.tsx",
          "/apps/web/src/lib/templates/safe-readme.tsx",
        ].some((suffix) => filename.endsWith(suffix))
        if (isMarkdownLinkRenderer) return {}

        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier" || node.name.name !== "a")
              return

            const href = node.attributes.find(
              (attribute) =>
                attribute.type === "JSXAttribute" &&
                attribute.name.type === "JSXIdentifier" &&
                attribute.name.name === "href"
            )
            const hrefValue = href?.value
            if (
              filename.endsWith(
                "/apps/web/src/app/(marketing)/customers/page.tsx"
              ) &&
              hrefValue?.type === "Literal" &&
              typeof hrefValue.value === "string" &&
              hrefValue.value.startsWith("mailto:")
            )
              return

            context.report({ node: node.name, messageId: "raw" })
          },
        }
      },
    },
    "no-raw-react-effects": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          raw: "Move React effect synchronization into a purpose-specific hook under the app hooks directory.",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename?.()
        if (
          !/(?:^|[/\\])apps[/\\](?:app|web)[/\\]/.test(filename) ||
          isWithinHooksDirectory(filename)
        )
          return {}
        return {
          CallExpression(node) {
            if (isReactEffectCall(context, node))
              context.report({ node, messageId: "raw" })
          },
        }
      },
    },
    "hooks-location": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          location:
            "Project-defined hooks that call hooks must live under the app hooks directory.",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename?.()
        if (
          !/(?:^|[/\\])apps[/\\](?:app|web)[/\\]/.test(filename) ||
          isWithinHooksDirectory(filename)
        )
          return {}
        const check = (node, name) => {
          if (name && /^use[A-Z0-9]/.test(name) && hasHookCall(node))
            context.report({ node, messageId: "location" })
        }
        return {
          FunctionDeclaration(node) {
            check(node, node.id?.name)
          },
          VariableDeclarator(node) {
            if (
              ["ArrowFunctionExpression", "FunctionExpression"].includes(
                node.init?.type
              )
            )
              check(node.init, node.id?.name)
          },
          MethodDefinition(node) {
            if (node.kind !== "constructor") check(node.value, node.key?.name)
          },
          PropertyDefinition(node) {
            if (
              ["ArrowFunctionExpression", "FunctionExpression"].includes(
                node.value?.type
              )
            )
              check(node.value, node.key?.name)
          },
          Property(node) {
            if (
              node.method ||
              ["ArrowFunctionExpression", "FunctionExpression"].includes(
                node.value?.type
              )
            ) {
              check(node.value, node.key?.name)
            }
          },
        }
      },
    },
  },
}

function isServerActionForm(node) {
  let hasServerAction = false
  let hasClientSubmitHandler = false

  for (const attribute of node.attributes ?? []) {
    if (
      attribute.type !== "JSXAttribute" ||
      attribute.name.type !== "JSXIdentifier"
    )
      continue
    if (attribute.name.name === "onSubmit") hasClientSubmitHandler = true
    if (
      attribute.name.name === "action" &&
      attribute.value?.type === "JSXExpressionContainer" &&
      ["Identifier", "MemberExpression"].includes(
        attribute.value.expression.type
      )
    ) {
      hasServerAction = true
    }
  }

  return hasServerAction && !hasClientSubmitHandler
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
