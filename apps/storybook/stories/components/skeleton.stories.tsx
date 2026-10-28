import type { Meta, StoryObj } from "@storybook/react-vite"
import { Skeleton } from "@workspace/ui/components/skeleton"

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>
export default meta
type Story = StoryObj<typeof meta>
export const LoadingCard: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  ),
}
