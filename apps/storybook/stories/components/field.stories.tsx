import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

const meta = {
  title: "Components/Field",
  component: Field,
  tags: ["autodocs"],
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="email">Email address</FieldLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
      <FieldDescription>
        We will only use this to contact you about your account.
      </FieldDescription>
    </Field>
  ),
}
