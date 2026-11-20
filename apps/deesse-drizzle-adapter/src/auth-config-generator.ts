export function generateAuthCliConfigSource(configSpecifier: string): string {
  return [
    'import { betterAuth } from "better-auth"',
    `import * as appConfig from ${JSON.stringify(configSpecifier)}`,
    "",
    "const deesse = appConfig.deesse",
    "const deesseConfig = appConfig.deesseConfig ?? appConfig.default",
    "const contributions = deesse ? [] : (deesseConfig?.plugins ?? []).map((registration) => {",
    "  const { definition } = registration",
    "  return \"args\" in registration ? definition.handler(registration.args) : definition.handler()",
    "})",
    "const contributedServerPlugins = contributions.flatMap((contribution) => contribution.auth?.serverPlugins ?? [])",
    "",
    "export const auth = deesse?.auth ?? betterAuth({",
    "  ...deesseConfig.auth,",
    "  plugins: [...(deesseConfig.auth.plugins ?? []), ...contributedServerPlugins],",
    "})",
    "",
  ].join("\n")
}
