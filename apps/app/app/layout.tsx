import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { APP_CONFIG } from "@workspace/ui/lib/config"
import { QueryClientProvider } from "@/components/query-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

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
				<QueryClientProvider>
					<ThemeProvider>
						<TooltipProvider>
							{children}
						</TooltipProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</body>
		</html>
	)
}
