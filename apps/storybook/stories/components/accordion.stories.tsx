import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  args: { type: "single" },
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="one">
        <AccordionTrigger>What is DeesseJS?</AccordionTrigger>
        <AccordionContent>
          A TypeScript toolkit for building full-stack applications.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
        <AccordionContent>
          Yes. The shared design tokens support both light and dark modes.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
