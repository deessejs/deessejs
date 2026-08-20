import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { APP_CONFIG } from "@workspace/ui/lib/config"
import { AppProviders } from "@/providers"

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
