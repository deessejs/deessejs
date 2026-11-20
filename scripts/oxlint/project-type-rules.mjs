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
  },
}

function isServerActionForm(node) {
  let hasServerAction = false
  let hasClientSubmitHandler = false

  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXIdentifier")
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
