import {
  ArrowDown,
  ArrowRight,
  Check,
  Mail,
  PanelsTopLeft,
  ShieldCheck,
} from "lucide-react"

function TechnologyLogo({
  name,
  logo,
  className = "",
}: {
  name: string
  logo: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground ${className}`}
    >
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

export function ArchitectureIllustration() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 sm:p-7 dark:border-sky-900/70 dark:from-sky-950/50 dark:via-background dark:to-violet-950/40">
      <div
        className="absolute -top-16 -right-12 size-48 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
              A clear place for every layer
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              One repo, shared foundations
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-sky-800 uppercase dark:bg-sky-950 dark:text-sky-200">
            Monorepo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-sky-200/80 bg-white/90 p-3 shadow-sm dark:border-sky-900 dark:bg-card/90">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Apps
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-2.5 py-2 text-xs font-medium text-sky-900 dark:bg-sky-950/70 dark:text-sky-100">
                <PanelsTopLeft className="size-3.5" aria-hidden /> Product app
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-2.5 py-2 text-xs font-medium text-violet-900 dark:bg-violet-950/70 dark:text-violet-100">
                <PanelsTopLeft className="size-3.5" aria-hidden /> Public
                website
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-violet-200/80 bg-white/90 p-3 shadow-sm dark:border-violet-900 dark:bg-card/90">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Shared packages
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100">
                Auth
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                Database
              </span>
              <span className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-900 dark:bg-violet-950/60 dark:text-violet-100">
                API
              </span>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-900 dark:bg-rose-950/60 dark:text-rose-100">
                Email
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span className="h-px flex-1 bg-sky-200 dark:bg-sky-900" />
          <span>shared types and configuration</span>
          <span className="h-px flex-1 bg-violet-200 dark:bg-violet-900" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <TechnologyLogo name="Next.js" logo="nextdotjs" />
          <TechnologyLogo name="Better Auth" logo="betterauth" />
          <TechnologyLogo name="Drizzle" logo="drizzle" />
          <TechnologyLogo name="PostgreSQL" logo="postgresql" />
        </div>
      </div>
    </div>
  )
}

export function AuthenticationIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
      <div className="w-full max-w-[250px] rounded-xl border border-emerald-200 bg-white p-3 shadow-sm dark:border-emerald-900 dark:bg-card">
        <div className="mb-3 flex items-center justify-between">
          <TechnologyLogo
            name="Better Auth"
            logo="betterauth"
            className="border-0 bg-transparent px-0"
          />
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Verified flow
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-7 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground">
            you@example.com
          </div>
          <div className="flex items-center justify-between rounded-md bg-emerald-100/80 px-2.5 py-2 text-[10px] text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden /> Email
              verification
            </span>
            <Check className="size-3.5" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DatabaseIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
      <div className="w-full max-w-[290px] overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm dark:border-blue-900 dark:bg-card">
        <div className="flex items-center justify-between border-b border-blue-100 px-3 py-2 dark:border-blue-900">
          <TechnologyLogo
            name="Drizzle ORM"
            logo="drizzle"
            className="border-0 bg-transparent px-0"
          />
          <span className="text-[10px] text-muted-foreground">PostgreSQL</span>
        </div>
        <div className="grid grid-cols-3 bg-blue-50/80 px-3 py-1.5 text-[10px] font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
          <span>user</span>
          <span>email</span>
          <span>verified</span>
        </div>
        <div className="grid grid-cols-3 px-3 py-2 text-[10px] text-muted-foreground">
          <span>id</span>
          <span>text</span>
          <span className="inline-flex items-center gap-1">
            <Check className="size-3 text-emerald-600" aria-hidden /> boolean
          </span>
        </div>
      </div>
    </div>
  )
}

export function ApiIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-violet-50 p-4 dark:bg-violet-950/40">
      <div className="w-full max-w-[300px] space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-white px-3 py-2 shadow-sm dark:border-violet-900 dark:bg-card">
          <span className="text-[10px] font-medium">Product app</span>
          <ArrowRight className="size-3.5 text-violet-600" aria-hidden />
          <span className="rounded bg-violet-100 px-2 py-1 font-mono text-[10px] text-violet-900 dark:bg-violet-950 dark:text-violet-100">
            getProfile
          </span>
        </div>
        <div
          className="mx-auto h-3 w-px bg-violet-300 dark:bg-violet-800"
          aria-hidden
        />
        <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-white px-3 py-2 shadow-sm dark:border-violet-900 dark:bg-card">
          <TechnologyLogo
            name="Hono + oRPC"
            logo="hono"
            className="border-0 bg-transparent px-0"
          />
          <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            Protected context
          </span>
        </div>
      </div>
    </div>
  )
}

export function EmailIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-rose-50 p-4 dark:bg-rose-950/40">
      <div className="w-full max-w-[270px] rounded-xl border border-rose-200 bg-white p-3 shadow-sm dark:border-rose-900 dark:bg-card">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-medium">
            <Mail className="size-4 text-rose-600" aria-hidden /> Verify your
            email
          </span>
          <span className="rounded bg-rose-100 px-1.5 py-1 text-[9px] text-rose-900 dark:bg-rose-950 dark:text-rose-100">
            React Email
          </span>
        </div>
        <div className="mt-3 rounded-lg bg-rose-50/80 p-3 dark:bg-rose-950/50">
          <p className="text-[10px] font-semibold">One step left</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Use the link in your message to verify your address.
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-rose-800 dark:text-rose-200">
            Email sent with Resend <ArrowRight className="size-3" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}

export function UiIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-amber-50 p-4 dark:bg-amber-950/40">
      <div className="w-full max-w-[290px] rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-card">
        <div className="mb-3 flex items-center gap-2">
          <TechnologyLogo
            name="Shared UI"
            logo="shadcnui"
            className="border-0 bg-transparent px-0"
          />
          <span className="text-[10px] text-muted-foreground">
            Tailwind CSS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-3 py-2 text-[10px] font-medium text-primary-foreground">
            Primary action
          </span>
          <span className="rounded-md border border-border px-3 py-2 text-[10px] font-medium">
            Secondary
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-sky-400" />
          <span className="size-3 rounded-full bg-violet-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  )
}

export function AppSurfacesIllustration() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-xl bg-cyan-50 p-4 dark:bg-cyan-950/40">
      <div className="grid w-full max-w-[290px] grid-cols-2 gap-2">
        <div className="rounded-xl border border-cyan-200 bg-white p-3 shadow-sm dark:border-cyan-900 dark:bg-card">
          <span className="rounded-md bg-cyan-100 px-2 py-1 text-[9px] font-medium text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100">
            apps/app
          </span>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-4/5 rounded bg-cyan-100 dark:bg-cyan-950" />
            <div className="h-2 w-3/5 rounded bg-muted" />
            <div className="h-7 rounded-md bg-cyan-100 dark:bg-cyan-950" />
          </div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm dark:border-teal-900 dark:bg-card">
          <span className="rounded-md bg-teal-100 px-2 py-1 text-[9px] font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100">
            apps/web
          </span>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-4/5 rounded bg-teal-100 dark:bg-teal-950" />
            <div className="h-2 w-3/5 rounded bg-muted" />
            <div className="h-7 rounded-md bg-teal-100 dark:bg-teal-950" />
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span>Shared packages</span>
          <ArrowDown className="size-3.5" aria-hidden />
          <span>both app surfaces</span>
        </div>
      </div>
    </div>
  )
}

export function ExtensionIllustration() {
  return (
    <div className="grid gap-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-7 dark:border-violet-900/70 dark:from-violet-950/40 dark:via-background dark:to-amber-950/30">
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <p className="text-xs font-semibold">Starter foundation</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            Auth
          </span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            Database
          </span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] text-violet-900 dark:bg-violet-950 dark:text-violet-100">
            API
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] text-rose-900 dark:bg-rose-950 dark:text-rose-100">
            Email
          </span>
        </div>
      </div>
      <ArrowRight
        className="hidden size-5 text-violet-600 sm:block"
        aria-hidden
      />
      <div className="rounded-xl border border-dashed border-violet-300 bg-violet-100/70 p-4 dark:border-violet-800 dark:bg-violet-950/40">
        <p className="text-xs font-semibold text-violet-950 dark:text-violet-100">
          Your product features
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-violet-900 dark:text-violet-100">
          <span className="rounded-lg bg-white/80 px-2 py-2 dark:bg-card">
            Workspaces
          </span>
          <span className="rounded-lg bg-white/80 px-2 py-2 dark:bg-card">
            Billing
          </span>
          <span className="rounded-lg bg-white/80 px-2 py-2 dark:bg-card">
            Your idea
          </span>
        </div>
        <p className="mt-3 text-[10px] text-violet-800 dark:text-violet-200">
          Examples only. These features are yours to build.
        </p>
      </div>
    </div>
  )
}
