import type { StorybookConfig } from "@storybook/react-vite"
import { fileURLToPath } from "node:url"
import { mergeConfig } from "vite"

const webSource = fileURLToPath(new URL("../../web/src", import.meta.url))

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  features: {
    componentsManifest: true,
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      resolve: {
        alias: {
          "@": webSource,
        },
      },
    }),
}

export default config
