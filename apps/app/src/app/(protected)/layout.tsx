import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/ui/sidebar"

import { AppHeader } from "@/components/headers/app-header"
import { AppSidebar } from "@/components/sidebars/app-sidebar"

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}