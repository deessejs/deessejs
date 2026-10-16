import Link from "next/link"
import { ArrowRight, Check, Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { CopyCommand } from "@/components/marketing/copy-command"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { STARTER_STACK } from "@/lib/marketing/home-data"

import { ProjectExplorer } from "./project-explorer"
import {
  ApiIllustration,
  AppSurfacesIllustration,
  AuthenticationIllustration,
  DatabaseIllustration,
  EmailIllustration,
  UiIllustration,
} from "./starter-illustrations"

const docsUrl = "https://docs.deessejs.com/getting-started"
const createCommand = "npx create-deesse-app@latest my-saas-app"

const foundations = [
  {
    title: "Authentication flows",
    description:
      "Better Auth is configured for email and password sign-in, verification, password resets, and sessions.",
    technology: "Better Auth",
    illustration: <AuthenticationIllustration />,
  },
  {
    title: "A typed database layer",
    description:
      "PostgreSQL and Drizzle define the user and session schema that the starter's auth flow uses.",
    technology: "Drizzle + PostgreSQL",
    illustration: <DatabaseIllustration />,
  },
  {
    title: "An authenticated API context",
    description:
      "Hono and oRPC show how an authenticated request reaches a protected procedure.",
    technology: "Hono + oRPC",
    illustration: <ApiIllustration />,
  },
  {
    title: "Email templates",
    description:
      "Verification and password reset emails use React Email templates, with a configurable delivery transport.",
    technology: "React Email + Resend",
    illustration: <EmailIllustration />,
  },
  {
    title: "Shared UI building blocks",
    description:
      "A shared UI package keeps components and styling consistent across both app surfaces.",
    technology: "shadcn UI + Tailwind CSS",
    illustration: <UiIllustration />,
  },
  {
    title: "Two app surfaces",
    description:
      "The product application and public website live in one monorepo alongside shared packages.",
    technology: "Turborepo monorepo",
    illustration: <AppSurfacesIllustration />,
  },
]

const included = [
  "Authentication and account flows",
  "Database schema and migrations",
  "Protected API example",
  "Shared UI and workspace setup",
]

const yours = [
  "Your product's domain model",
  "Your customer-facing workflows",
  "Your business rules and permissions",
  "Your brand and product content",
]

const questions = [
  {
    question: "How long will the starter be free?",
    answer:
      "It is free until the DeesseJS platform launches. There is no launch date set today.",
  },
  {
    question: "Will I keep the version I download?",
    answer:
      "Yes. Your downloaded copy remains yours to use. Later versions may be paid and are not included with an earlier download.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can create a project with the CLI or access the public repository directly on GitHub.",
  },
  {
    question: "Where can I get help?",
    answer:
      "Open a GitHub issue or email support@deessejs.com. Support is available through those channels, with no response-time guarantee.",
  },
]

function SectionHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="max-w-3xl px-6 py-9 sm:px-8 sm:py-12 lg:px-10">
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function ProductScope() {
  return (
    <section className="border-b border-border">
      <SectionHeading
        title="What you get, and what you build."
        description="The account and infrastructure foundations are connected. Your domain model, customer workflows, and business rules still need to be built for your product."
      />
      <div className="grid border-t border-border md:grid-cols-2">
        <div className="border-b border-border p-6 sm:p-8 md:border-r md:border-b-0 lg:p-10">
          <h3 className="text-lg font-semibold tracking-tight">
            Included in the starter
          </h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-8 lg:p-10">
          <h3 className="text-lg font-semibold tracking-tight">
            You build for your product
          </h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {yours.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <Plus
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function StarterHomepage() {
  return (
    <div className="starter-homepage">
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-14 text-center sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <p className="mb-6 inline-flex w-fit items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Free until the platform launches
          </p>
          <h1 className="max-w-4xl text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Start with the foundations. Build the product that is yours.
          </h1>
          <p className="mt-6 max-w-2xl text-copy-16 leading-7 text-muted-foreground sm:text-copy-18">
            A practical Next.js SaaS starter with authentication, a typed
            PostgreSQL layer, and a monorepo designed to grow with your product.
          </p>
          <CopyCommand command={createCommand} className="mt-8 max-w-full" />
          <Button asChild size="lg" className="mt-4">
            <Link href={docsUrl}>Getting Started</Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="built-with-title"
        className="border-b border-border"
      >
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-5 sm:px-8 lg:px-10">
            <h2
              id="built-with-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Core technologies
            </h2>
          </div>
          <TechStackGrid
            techs={STARTER_STACK}
            className="grid-cols-2 md:grid-cols-4"
          />
        </div>
      </section>

      <section
        id="inside-the-starter"
        className="scroll-mt-20 border-b border-border"
      >
        <SectionHeading
          title="A monorepo with clear boundaries."
          description="Browse real files from the starter to see how authentication, the database, and protected API procedures fit together."
        />
        <div className="px-5 pb-8 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
          <ProjectExplorer />
        </div>
      </section>

      <section className="border-b border-border">
        <SectionHeading
          title="Core systems already connected."
          description="Authentication, data, API, email, shared UI, and app surfaces use the technologies already wired into the repository."
        />
        <div className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((item, index) => (
            <article
              key={item.title}
              className={`min-w-0 border-b border-border p-5 sm:p-6 lg:p-7 ${index % 2 === 0 ? "sm:border-r" : ""} ${index >= 4 ? "sm:border-b-0" : ""} ${index % 3 !== 2 ? "lg:border-r" : "lg:border-r-0"} ${index >= 3 ? "lg:border-b-0" : ""}`}
            >
              {item.illustration}
              <p className="mt-5 text-xs font-medium text-muted-foreground">
                {item.technology}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <ProductScope />

      <section
        aria-labelledby="launch-offer-title"
        className="border-b border-border px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-20"
      >
        <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-border bg-background">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:p-12">
            <div>
              <span className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
                Available now
              </span>
              <h2
                id="launch-offer-title"
                className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                Download the starter while it is free.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                The free offer ends when the DeesseJS platform launches. There
                is no launch date set today.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href={docsUrl}>
                  Get the starter <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-border bg-background p-4">
                <p className="text-sm font-semibold">Get it directly</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Use the CLI or public GitHub repository. No account is needed.
                </p>
              </div>
              <div className="border border-border bg-background p-4">
                <p className="text-sm font-semibold">Keep your copy</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The version you download remains yours to use.
                </p>
              </div>
              <div className="border border-border bg-background p-4">
                <p className="text-sm font-semibold">
                  Future versions may be paid
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Later releases are not included with this download.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="questions-title"
        className="border-b border-border"
      >
        <div className="grid gap-5 px-6 py-9 sm:px-8 sm:py-12 lg:grid-cols-[0.7fr_1.3fr] lg:px-10">
          <div>
            <h2
              id="questions-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Questions and support.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The practical details before you get started.
            </p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {questions.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    className="font-mono text-muted-foreground transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
