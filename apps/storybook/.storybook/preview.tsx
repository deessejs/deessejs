import type { Preview } from "@storybook/react-vite"
import "@workspace/ui/globals.css"
import { Geist, Geist_Mono } from "next/font/google"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const preview: Preview = {
  globalTypes: {
    mode: {
      description: "DeesseJS design system color mode",
      defaultValue: "light",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.classList.toggle(
        "dark",
        context.globals.mode === "dark"
      )

      return (
        <div className={`${geist.variable} ${geistMono.variable} min-h-screen bg-background p-6 font-sans text-foreground antialiased`}>
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Start Here", "Components"],
      },
    },
  },
}

export default preview
