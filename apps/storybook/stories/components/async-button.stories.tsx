import type { Meta, StoryObj } from "@storybook/react-vite"
import { AsyncButton } from "@workspace/ui/components/async-button"

const meta = {
  title: "Components/AsyncButton",
  component: AsyncButton,
  tags: ["autodocs"],
} satisfies Meta<typeof AsyncButton>

export default meta
type Story = StoryObj<typeof meta>

export const Saves: Story = {
  render: () => (
    <AsyncButton
      pendingAnnouncement="Saving changes"
      onClick={() => new Promise<void>((resolve) => setTimeout(resolve, 1200))}
    >
      Save Changes
    </AsyncButton>
  ),
}
