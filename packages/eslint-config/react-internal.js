import { config as baseConfig } from "./base.js"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

const config = [
  ...baseConfig,
  {
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Discourage raw HTML controls in apps/* — prefer @workspace/ui shadcn components
      // See: .claude/skills/use-shadcn/SKILL.md
      "react/forbid-elements": [
        "warn",
        {
          forbid: [
            {
              element: "input",
              message:
                "Use <Input /> from @workspace/ui/components/input (or <InputField /> wrapper in apps/app/components/auth/field.tsx).",
            },
            {
              element: "button",
              message:
                "Use <Button /> from @workspace/ui/components/button with variant/size props.",
            },
            {
              element: "select",
              message: "Use <Select /> from @workspace/ui/components/select.",
            },
            {
              element: "textarea",
              message: "Use <Textarea /> from @workspace/ui/components/textarea.",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
]

export { config }
