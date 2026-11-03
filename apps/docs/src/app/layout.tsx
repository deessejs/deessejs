import { RootProvider } from "fumadocs-ui/provider/next"
import "./global.css"
import { Geist, Geist_Mono } from "next/font/google"
import { AnalyticsConsent } from "@workspace/analytics"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <AnalyticsConsent />
      </body>
    </html>
  )
}
