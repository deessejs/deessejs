import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { cn } from "@workspace/ui/lib/utils"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"

import "./globals.css"
import { WEB_URL } from "@/lib/urls"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(WEB_URL),
  title: {
    default: "DeesseJS",
    template: "%s | DeesseJS",
  },
  description:
    "The SaaS template that never sleeps. Ship your agents as your developers.",
  keywords: [
    "Next.js SaaS template",
    "SaaS boilerplate",
    "Next.js starter kit",
    "TypeScript SaaS",
    "shadcn/ui template",
    "agentic AI SaaS",
    "multi-tenant SaaS",
  ],
  openGraph: {
    type: "website",
    siteName: "DeesseJS",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@deessejs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${WEB_URL}/#website`,
    url: WEB_URL,
    name: "DeesseJS",
    description:
      "The SaaS template that never sleeps. Ship your agents as your developers.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${WEB_URL}/blog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${WEB_URL}/#organization`,
    name: "DeesseJS",
    url: WEB_URL,
    description:
      "The SaaS template that never sleeps. Ship your agents as your developers.",
    sameAs: ["https://github.com/nesalia-inc/deessejs"],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
