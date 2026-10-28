import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { toast } from "sonner"

const meta = {
  title: "Components/Sonner",
  component: Toaster,
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>
export default meta
type Story = StoryObj<typeof meta>
export const Toasts: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toaster />
      <Button onClick={() => toast.success("Changes saved")}>
        Show success toast
      </Button>
      <Button
        variant="outline"
        onClick={() => toast("A new update is available")}
      >
        Show toast
      </Button>
    </div>
  ),
}
