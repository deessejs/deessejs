import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Collapsible className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Recent activity</span>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            Toggle
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="rounded-md border p-3 text-sm">
        Your workspace is up to date.
      </CollapsibleContent>
    </Collapsible>
  ),
}
