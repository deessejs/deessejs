import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover or focus</Button>
        </TooltipTrigger>
        <TooltipContent>Helpful additional context</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
