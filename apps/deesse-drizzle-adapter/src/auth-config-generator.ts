export function generateAuthCliConfigSource(configSpecifier: string): string {
  return [
    'import { betterAuth } from "better-auth"',
    `import { deesseConfig } from ${JSON.stringify(configSpecifier)}`,
    "",
    "const contributions = (deesseConfig.plugins ?? []).map((registration) => {",
    "  const { definition } = registration",
    "  return \"args\" in registration ? definition.handler(registration.args) : definition.handler()",
    "})",
    "const contributedServerPlugins = contributions.flatMap((contribution) => contribution.auth?.serverPlugins ?? [])",
    "",
    "export const auth = betterAuth({",
    "  ...deesseConfig.auth,",
    "  plugins: [...(deesseConfig.auth.plugins ?? []), ...contributedServerPlugins],",
    "})",
    "",
  ].join("\n")
}
