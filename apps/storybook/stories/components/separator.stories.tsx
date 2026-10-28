import type { Meta, StoryObj } from "@storybook/react-vite"
import { Separator } from "@workspace/ui/components/separator"

const meta = {
  title: "Components/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>
export default meta
type Story = StoryObj<typeof meta>
export const Orientations: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-4">
      <span>Overview</span>
      <Separator orientation="vertical" />
      <span>Settings</span>
      <Separator orientation="vertical" />
      <span>Help</span>
    </div>
  ),
}
