import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { APP_CONFIG } from "@workspace/ui/lib/config"
import { AppProviders } from "@/components/providers"
import { AppFooter } from "@/components/footers/app-footer"
import { SiteHeader } from "@/components/headers/site-header"
import { CookieConsent } from "@workspace/cookies"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
            <CookieConsent />
            <Toaster />
          </div>
        </AppProviders>
      </body>
    </html>
  )
}
