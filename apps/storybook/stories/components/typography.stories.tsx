import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  InlineCode,
  List,
  P,
} from "@workspace/ui/components/typography"

const meta = {
  title: "Components/Typography",
  component: H1,
  tags: ["autodocs"],
} satisfies Meta<typeof H1>
export default meta
type Story = StoryObj<typeof meta>
export const Scale: Story = {
  args: { children: "Typography scale" },
  render: () => (
    <article className="grid max-w-2xl gap-4">
      <H1>Heading one</H1>
      <H2>Heading two</H2>
      <H3>Heading three</H3>
      <H4>Heading four</H4>
      <P>
        Body text uses the shared typography primitives. Inline code looks like{" "}
        <InlineCode>pnpm dev</InlineCode>.
      </P>
      <Blockquote>Clear hierarchy helps every page feel consistent.</Blockquote>
      <List>
        <li>Readable defaults</li>
        <li>Shared semantic tokens</li>
      </List>
    </article>
  ),
}
