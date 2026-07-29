import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"

import { APP_NAME } from "@workspace/ui/lib/config"
import { AppSidebar } from "@/components/sidebars/app-sidebar"
import { Separator } from "@workspace/ui/components/separator"
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{APP_NAME}</h1>
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}