import { HomeHeader } from "@/components/headers/home-header"

/**
 * Layout for public routes — /login, /signup, /forgot-password, /reset-password.
 *
 * Provides the sticky header + centered main shell. Mirrors apps/web's
 * (unprotected)/layout.tsx so the auth surface feels consistent across
 * the operator's marketing site and the buyer-facing app.
 */
export default function UnprotectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col selection:bg-foreground selection:text-background">
      <HomeHeader />
      <main className="flex-1 border-x border-border/40 mx-auto w-full max-w-[1400px] grid place-items-center p-4">
        {children}
      </main>
    </div>
  )
}