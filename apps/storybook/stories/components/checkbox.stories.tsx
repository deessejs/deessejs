import type { Meta, StoryObj } from "@storybook/react-vite"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">Accept the terms and conditions</Label>
    </div>
  ),
}
