import Link from "next/link"
import { ArrowDown, ArrowRight, Check, GitBranch, Layers3, Terminal } from "lucide-react"

import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { STARTER_STACK } from "@/lib/marketing/home-data"

import { ProjectExplorer, ProjectPreview } from "./project-explorer"

const docsUrl = "https://docs.deessejs.com/getting-started"
const repoUrl = "https://github.com/deessejs/saas-template"

const capabilities = [
  {
    number: "01",
    title: "Authentication flows",
    description: "Email and password sign-in with email verification, password reset, and session management.",
    code: "requireEmailVerification: true",
    tag: "Better Auth",
  },
  {
    number: "02",
    title: "A real database schema",
    description: "PostgreSQL with Drizzle ORM gives your app a typed foundation you can extend.",
    code: 'pgTable("user", { id, name, email })',
    tag: "Drizzle ORM",
  },
  {
    number: "03",
    title: "Protected API context",
    description: "A protected profile endpoint demonstrates how authenticated context reaches your API.",
    code: "protectedBase.handler(({ context }) => context.user)",
    tag: "Hono · oRPC",
  },
  {
    number: "04",
    title: "Email templates",
    description: "Verification and password reset emails are built with React Email and sent through Resend.",
    code: "VerifyEmail · ResetPassword",
    tag: "React Email",
  },
  {
    number: "05",
    title: "Shared UI package",
    description: "Reusable components and tokens live in one package, ready for both app surfaces.",
    code: "@workspace/ui/components/*",
    tag: "Tailwind CSS",
  },
  {
    number: "06",
    title: "Two app surfaces",
    description: "A product application and a public website sit side by side in the same monorepo.",
    code: "apps/app · apps/web",
    tag: "Turborepo",
  },
]

const questions = [
  {
    question: "How long will the starter be free?",
    answer: "It is free until the DeesseJS platform launches. There is no launch date set today.",
  },
  {
    question: "Will I keep the version I download?",
    answer: "Yes. Your downloaded copy remains yours. Later versions may be paid, and they are not included with an earlier free download.",
  },
  {
    question: "Do I need an account to get it?",
    answer: "No account is required. You can access the repository directly on GitHub and follow the getting-started guide.",
  },
  {
    question: "Where can I get help?",
    answer: "Open a GitHub issue or email support@deessejs.com. Support is available through those channels, with no response-time guarantee.",
  },
]

function SectionTitle({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="grid gap-5 border-b border-border p-6 sm:p-8 lg:grid-cols-[150px_1fr] lg:p-10">
      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{index} / {eyebrow}</p>
      <div>
        <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
    </div>
  )
}

export function StarterHomepage() {
  return (
    <>
      <section className="grid border-b border-border lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <p className="mb-6 inline-flex w-fit items-center gap-2 border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-foreground" aria-hidden />
            FREE UNTIL THE PLATFORM LAUNCHES
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
            Start your SaaS with the hard parts in place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            An open source Next.js SaaS starter with authentication, a PostgreSQL data layer, and a monorepo you can make your own.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={docsUrl} className="inline-flex min-h-11 items-center justify-center gap-2 bg-foreground px-5 text-sm font-medium text-background hover:opacity-85">
              Read the getting-started guide <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 border border-border px-5 text-sm font-medium hover:bg-muted">
              <GitBranch className="size-4" aria-hidden /> View on GitHub
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">No account required. Keep the version you download; future versions may be paid.</p>
          <a href="#inside-the-starter" className="mt-10 flex w-fit items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground">
            Explore the project <ArrowDown className="size-3.5" aria-hidden />
          </a>
        </div>
        <div className="flex items-center border-t border-border bg-muted/20 p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <ProjectPreview />
        </div>
      </section>

      <section aria-labelledby="built-with-title" className="border-b border-border">
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-6 sm:px-8 lg:px-10">
            <h2 id="built-with-title" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">A familiar, production-ready stack</h2>
          </div>
          <TechStackGrid techs={STARTER_STACK} />
        </div>
      </section>

      <section id="inside-the-starter" className="border-b border-border">
        <SectionTitle index="01" eyebrow="Explore the codebase" title="A monorepo you can understand before you change it." description="Select a project area to see how the starter is organized. The snippets come from the repository and show the seams where your product code begins." />
        <div className="p-5 sm:p-8 lg:p-10"><ProjectExplorer /></div>
      </section>

      <section className="border-b border-border">
        <SectionTitle index="02" eyebrow="Already in place" title="Useful foundations, without pretending your product is built." description="The starter gives you working infrastructure and example surfaces. Your domain model, product workflows, and business rules are yours to add." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, index) => (
            <article key={item.number} className={`min-w-0 border-border p-6 sm:p-8 ${index % 2 === 0 ? "sm:border-r" : ""} ${index < 4 ? "border-b" : ""} lg:border-r ${index % 3 !== 2 ? "lg:border-r" : "lg:border-r-0"} ${index >= 3 ? "lg:border-b-0" : ""}`}>
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>{item.number}</span><span>{item.tag}</span>
              </div>
              <h3 className="mt-7 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <pre className="mt-5 overflow-x-auto border border-border bg-muted/40 p-3 text-xs leading-5"><code>{item.code}</code></pre>
            </article>
          ))}
        </div>
      </section>

      <section className="grid border-b border-border lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">03 / Make it yours</p>
          <h2 className="mt-6 max-w-lg text-2xl font-semibold tracking-tight text-balance sm:text-3xl">A starting point, not a finished product.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Use the shared packages to add the features your SaaS actually needs. This example shows where a workspace feature could fit; it is illustrative and is not included as a ready-made module.</p>
          <Link href={repoUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Browse the source <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <div className="bg-muted/20 p-6 sm:p-8 lg:p-10">
          <div className="border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-mono text-xs text-muted-foreground"><Layers3 className="size-4" aria-hidden /> Example extension · illustrative</div>
            <pre className="overflow-x-auto p-5 text-xs leading-6 sm:p-7 sm:text-sm"><code>{`// An example of a feature you could add\nexport const workspaces = pgTable("workspace", {\n  id: text("id").primaryKey(),\n  name: text("name").notNull(),\n  ownerId: text("owner_id")\n    .references(() => users.id),\n})`}</code></pre>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Illustrative code only. Workspaces are not part of the starter.</p>
        </div>
      </section>

      <section className="grid border-b border-border lg:grid-cols-[150px_1fr]">
        <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">04 / Get started</p>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Start from the repository.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">The getting-started guide walks through prerequisites, setup, and your first run. You can also clone the public repository directly.</p>
            <Link href={docsUrl} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-foreground px-5 text-sm font-medium text-background hover:opacity-85">Open the getting-started guide <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <div className="min-w-0 border border-border bg-muted/30 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground"><Terminal className="size-4" aria-hidden /> Terminal</div>
            <pre className="overflow-x-auto text-xs leading-6"><code>{`git clone ${repoUrl}.git my-saas-app\ncd my-saas-app\npnpm install`}</code></pre>
            <Link href={repoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs underline underline-offset-4">Open the GitHub repository <ArrowRight className="size-3" aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <SectionTitle index="05" eyebrow="Launch offer" title="Free to download until the platform launches." description="Get the current starter directly from GitHub while the DeesseJS platform is in development. No account, email signup, or limited download count." />
        <div className="grid gap-px bg-border sm:grid-cols-3">
          <div className="bg-background p-6 sm:p-8"><Check className="size-4" aria-hidden /><h3 className="mt-4 font-medium">Download now</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Access the repository and getting-started guide without creating an account.</p></div>
          <div className="bg-background p-6 sm:p-8"><Check className="size-4" aria-hidden /><h3 className="mt-4 font-medium">Keep your copy</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">The version you download remains yours to use after the offer ends.</p></div>
          <div className="bg-background p-6 sm:p-8"><Check className="size-4" aria-hidden /><h3 className="mt-4 font-medium">Future versions may be paid</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Later versions will be offered through the platform and are not included with this download.</p></div>
        </div>
        <p className="border-t border-border px-6 py-4 text-xs leading-5 text-muted-foreground sm:px-8 lg:px-10">The free offer ends when the DeesseJS platform launches. No date has been set. The current version is included in the future Professional and Agency template plans.</p>
      </section>

      <section className="border-b border-border">
        <SectionTitle index="06" eyebrow="Questions & support" title="A few practical details." />
        <div className="divide-y divide-border">
          {questions.map((item) => (
            <details key={item.question} className="group px-6 py-5 open:bg-muted/20 sm:px-8 lg:px-10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium [&::-webkit-details-marker]:hidden">{item.question}<span className="font-mono text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span></summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center lg:p-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Build on a clear foundation</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Your next SaaS starts here.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Read the guide, explore the code, and shape the product you want to build.</p>
        </div>
        <Link href={docsUrl} className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-foreground px-5 text-sm font-medium text-background hover:opacity-85">Get started <ArrowRight className="size-4" aria-hidden /></Link>
      </section>
    </>
  )
}
