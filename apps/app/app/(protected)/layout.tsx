import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"

import { APP_NAME } from "@/lib/app-config"
import { AppSidebar } from "@/components/sidebars/app-sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { requireCompleteSession } from "@/lib/require-complete-session"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ADR-031: defense-in-depth gate. The proxy already enforces the
  // four invariants at the edge; this Server-Component call makes
  // sure every protected page is gated regardless of any future
  // matcher change.
	await requireCompleteSession()

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