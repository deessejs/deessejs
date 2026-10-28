import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@workspace/ui/components/button"

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          "default",
          "secondary",
          "outline",
          "ghost",
          "destructive",
          "link",
        ] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        +
      </Button>
    </div>
  ),
}
