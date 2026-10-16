import {
  ArrowRight,
  Check,
  Folder,
  Mail,
  PanelsTopLeft,
  ShieldCheck,
} from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"

function TechnologyLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/logos/${logo}.svg`}
        alt=""
        width="16"
        height="16"
        className="size-4"
        aria-hidden
      />
      {name}
    </span>
  )
}

function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[156px] items-center justify-center border-b border-border bg-background p-4">
      {children}
    </div>
  )
}

export function AuthenticationIllustration() {
  return (
    <IllustrationFrame>
      <div className="w-full max-w-[270px] rounded-lg border border-border bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <TechnologyLogo name="Better Auth" logo="betterauth" />
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-400">
            <Check className="size-3" aria-hidden /> Verified
          </span>
        </div>
        <div className="rounded-md border border-border px-2.5 py-2 text-[10px] text-muted-foreground">
          you@example.com
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-foreground" aria-hidden />
          Email verification and sessions are configured
        </div>
      </div>
    </IllustrationFrame>
  )
}

export function DatabaseIllustration() {
  return (
    <IllustrationFrame>
      <div className="w-full max-w-[290px] overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <TechnologyLogo name="Drizzle ORM" logo="drizzle" />
          <span className="text-[10px] text-muted-foreground">PostgreSQL</span>
        </div>
        <div className="grid grid-cols-3 border-b border-border px-3 py-2 text-[10px] font-medium">
          <span>user</span>
          <span>email</span>
          <span>verified</span>
        </div>
        <div className="grid grid-cols-3 px-3 py-2 text-[10px] text-muted-foreground">
          <span>user_01</span>
          <span>ada@site.dev</span>
          <span className="text-emerald-700 dark:text-emerald-400">true</span>
        </div>
      </div>
    </IllustrationFrame>
  )
}

export function ApiIllustration() {
  return (
    <IllustrationFrame>
      <div className="flex w-full max-w-[300px] flex-col items-stretch gap-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <span className="text-[10px] font-medium">Product app</span>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="rounded border border-border px-2 py-1 font-mono text-[10px]">
            getProfile
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <TechnologyLogo name="Hono + oRPC" logo="hono" />
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-foreground" aria-hidden />
            Protected context
          </span>
        </div>
      </div>
    </IllustrationFrame>
  )
}

export function EmailIllustration() {
  return (
    <IllustrationFrame>
      <div className="w-full max-w-[280px] rounded-lg border border-border bg-background p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium">
            <Mail className="size-4" aria-hidden /> Verify your email
          </span>
          <TechnologyLogo name="Resend" logo="resend" />
        </div>
        <div className="py-2">
          <p className="text-[10px] font-semibold">One step left</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Use the link in your message to verify your address.
          </p>
        </div>
        <TechnologyLogo name="React Email" logo="react" />
      </div>
    </IllustrationFrame>
  )
}

export function UiIllustration() {
  return (
    <IllustrationFrame>
      <div className="w-full max-w-[290px] rounded-lg border border-border bg-background p-3 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TechnologyLogo name="Shared UI" logo="shadcnui" />
          <span className="text-[10px] text-muted-foreground">
            Tailwind CSS
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Save changes</Button>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </IllustrationFrame>
  )
}

export function AppSurfacesIllustration() {
  return (
    <IllustrationFrame>
      <div className="w-full max-w-[290px] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-background p-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium">
              <PanelsTopLeft className="size-3.5" aria-hidden /> apps/app
            </span>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Product app
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium">
              <PanelsTopLeft className="size-3.5" aria-hidden /> apps/web
            </span>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Public site
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[10px] text-muted-foreground">
          <Folder className="size-3.5" aria-hidden />
          Shared workspace packages
        </div>
      </div>
    </IllustrationFrame>
  )
}
