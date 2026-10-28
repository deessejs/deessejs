import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>
export default meta
type Story = StoryObj<typeof meta>
export const RightSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Quick links for your workspace.</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-3 px-4 text-sm">
          <a href="#">Overview</a>
          <a href="#">Components</a>
          <a href="#">Settings</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
}
