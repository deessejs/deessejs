import type { Meta, StoryObj } from "@storybook/react-vite"
import { Textarea } from "@workspace/ui/components/textarea"

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Textarea className="max-w-sm" placeholder="Write a message..." />
  ),
}
