import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "@workspace/ui/components/input"

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>
export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-3">
      <Input placeholder="Your name" />
      <Input type="email" defaultValue="hello@deessejs.com" />
      <Input disabled placeholder="Disabled" />
    </div>
  ),
}
