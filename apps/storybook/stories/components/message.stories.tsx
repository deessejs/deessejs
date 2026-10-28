import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@workspace/ui/components/message"

const meta = {
  title: "Components/Message",
  component: Message,
  tags: ["autodocs"],
} satisfies Meta<typeof Message>
export default meta
type Story = StoryObj<typeof meta>
export const Conversation: Story = {
  render: () => (
    <MessageGroup className="w-full max-w-lg">
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble>
            <BubbleContent>How can I help you today?</BubbleContent>
          </Bubble>
          <MessageFooter>Just now</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <Bubble variant="tinted">
            <BubbleContent>Show me the shared UI components.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
}
