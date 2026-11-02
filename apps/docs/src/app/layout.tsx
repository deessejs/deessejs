import { RootProvider } from "fumadocs-ui/provider/next"
import "./global.css"
import { Inter } from "next/font/google"
import { AnalyticsConsent } from "@workspace/analytics"
import type { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.deessejs.com"),
  title: {
    default: "DeesseJS Documentation",
    template: "%s | DeesseJS Documentation",
  },
  alternates: { canonical: "/" },
}

const inter = Inter({
  subsets: ["latin"],
})

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <AnalyticsConsent />
      </body>
    </html>
  )
}
