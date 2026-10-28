import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

const meta = {
  title: "Components/Command",
  component: Command,
  tags: ["autodocs"],
} satisfies Meta<typeof Command>
export default meta
type Story = StoryObj<typeof meta>
export const Search: Story = {
  render: () => (
    <Command className="w-full max-w-sm rounded-lg border">
      <CommandInput placeholder="Search components..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Components">
          <CommandItem>Accordion</CommandItem>
          <CommandItem>Button</CommandItem>
          <CommandItem>Dialog</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}
