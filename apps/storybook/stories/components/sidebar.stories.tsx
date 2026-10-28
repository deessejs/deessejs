import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

const meta = {
  title: "Components/Sidebar",
  component: SidebarProvider,
  tags: ["autodocs"],
} satisfies Meta<typeof SidebarProvider>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>Overview</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Components</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="p-4">
        <SidebarTrigger />
        <span className="ml-3 text-sm">Main content</span>
      </main>
    </SidebarProvider>
  ),
}
