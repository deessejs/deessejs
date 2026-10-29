import type { Meta, StoryObj } from "@storybook/react-vite"
import { FAQSection } from "@/components/pages/homepage/faq-section"

const meta = {
  title: "Web/Marketing/Homepage/FAQ",
  component: FAQSection,
  tags: ["autodocs"],
} satisfies Meta<typeof FAQSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
