import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@workspace/ui/components/bubble"

const meta = {
  title: "Components/Bubble",
  component: Bubble,
  tags: ["autodocs"],
} satisfies Meta<typeof Bubble>
export default meta
type Story = StoryObj<typeof meta>
export const Variants: Story = {
  render: () => (
    <BubbleGroup className="w-full max-w-md gap-3">
      <Bubble>
        <BubbleContent>Here is the default assistant message.</BubbleContent>
      </Bubble>
      <Bubble variant="tinted">
        <BubbleContent>A tinted bubble for a softer emphasis.</BubbleContent>
      </Bubble>
      <Bubble variant="outline" data-align="end">
        <BubbleContent>An outlined response.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
}
