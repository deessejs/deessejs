import { SiteHeader } from "@/components/headers/site-header"

export default function UnprotectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      {children}
    </div>
  )
}