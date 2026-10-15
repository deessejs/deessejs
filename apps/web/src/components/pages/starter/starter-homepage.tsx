import Link from "next/link"
import { ArrowRight, BookOpen, GitBranch } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { STARTER_STACK } from "@/lib/marketing/home-data"

import { ProjectExplorer } from "./project-explorer"
import {
  ApiIllustration,
  AppSurfacesIllustration,
  AuthenticationIllustration,
  DatabaseIllustration,
  EmailIllustration,
  ExtensionIllustration,
  UiIllustration,
} from "./starter-illustrations"

const docsUrl = "https://docs.deessejs.com/getting-started"
const repoUrl = "https://github.com/deessejs/saas-template"

const foundations = [
  {
    title: "Authentication that is already connected",
    description:
      "Better Auth is configured with email verification, password reset, and sessions.",
    technology: "Better Auth",
    illustration: <AuthenticationIllustration />,
  },
  {
    title: "A database schema you can extend",
    description:
      "PostgreSQL and Drizzle provide the typed schema behind users and sessions.",
    technology: "Drizzle + PostgreSQL",
    illustration: <DatabaseIllustration />,
  },
  {
    title: "A protected API boundary",
    description:
      "Hono and oRPC show how authenticated request context reaches a procedure.",
    technology: "Hono + oRPC",
    illustration: <ApiIllustration />,
  },
  {
    title: "Transactional email foundations",
    description:
      "Verification and password reset templates use React Email and Resend.",
    technology: "React Email + Resend",
    illustration: <EmailIllustration />,
  },
  {
    title: "Shared interface building blocks",
    description:
      "A shared UI package keeps app surfaces on the same component and styling system.",
    technology: "shadcn UI + Tailwind CSS",
    illustration: <UiIllustration />,
  },
  {
    title: "Separate product and marketing apps",
    description:
      "The product app and public website live together and share workspace packages.",
    technology: "Turborepo monorepo",
    illustration: <AppSurfacesIllustration />,
  },
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
      "No account is required. You can access the repository directly on GitHub and follow the getting-started guide.",
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

export function StarterHomepage() {
  return (
    <div className="starter-homepage">
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start px-6 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <p className="mb-6 inline-flex w-fit items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Free until the platform launches
          </p>
          <h1 className="max-w-5xl text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Start with the foundations. Build the product that is yours.
          </h1>
          <p className="mt-6 max-w-2xl text-copy-16 leading-7 text-muted-foreground sm:text-copy-18">
            A practical Next.js SaaS starter with authentication, a typed
            PostgreSQL layer, and a monorepo designed to grow with your product.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={docsUrl}>
                Read the getting-started guide{" "}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={repoUrl} target="_blank" rel="noreferrer">
                <GitBranch className="size-4" aria-hidden /> View the GitHub
                repository
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            No account required. Keep the version you download. Later versions
            may be paid.
          </p>
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
              The technologies in this starter
            </h2>
          </div>
          <TechStackGrid techs={STARTER_STACK} />
        </div>
      </section>

      <section
        id="inside-the-starter"
        className="scroll-mt-20 border-b border-border"
      >
        <SectionHeading
          title="See how the pieces fit before you change them."
          description="Explore the actual monorepo and open representative files from its authentication, database, and API packages."
        />
        <div className="px-5 pb-8 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
          <ProjectExplorer />
        </div>
      </section>

      <section className="border-b border-border">
        <SectionHeading
          title="Useful foundations, without pretending your product is built."
          description="The starter connects common infrastructure and gives you clear examples. Your domain model, product workflows, and business rules are yours to add."
        />
        <div className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((item, index) => (
            <article
              key={item.title}
              className={`min-w-0 border-border p-5 sm:p-6 lg:p-7 ${index % 2 === 0 ? "sm:border-r" : ""} ${index < 4 ? "border-b" : ""} ${index % 3 !== 2 ? "lg:border-r" : "lg:border-r-0"} ${index >= 3 ? "lg:border-b-0" : ""}`}
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

      <section className="border-b border-border">
        <div className="grid gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10 lg:py-16">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Make it yours
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              A starting point, not a finished product.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              Keep the shared foundations that help you move faster, then shape
              the product around your own customers and ideas.
            </p>
          </div>
          <div>
            <ExtensionIllustration />
            <p className="mt-3 text-xs text-muted-foreground">
              Workspaces and billing are examples of features you could add.
              They are not included in this starter.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="get-started-title"
        className="border-b border-border"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-16">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Start building
            </p>
            <h2
              id="get-started-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
            >
              Choose your next step.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Follow the guide for setup, or inspect the source and decide how
              you want to shape the codebase.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={docsUrl}
              className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
                <BookOpen className="size-5" aria-hidden />
              </span>
              <span className="mt-4 block font-semibold">Read the guide</span>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                Setup steps and your first run.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Get started{" "}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
            <Link
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
                <GitBranch className="size-5" aria-hidden />
              </span>
              <span className="mt-4 block font-semibold">
                Explore the source
              </span>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                Browse the public GitHub repository.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                View repository{" "}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="launch-offer-title"
        className="border-b border-border px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-20"
      >
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border bg-background">
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
                is no launch date set today, and there is no download limit.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href={docsUrl}>
                  Get the starter <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Download directly</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  No account, email signup, or waitlist.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Keep your copy</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The version you download remains yours to use.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">
                  Future versions may be paid
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Later releases are not included with this download.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-background px-6 py-4 text-xs leading-5 text-muted-foreground sm:px-9 lg:px-12">
            The current version will remain available through the future
            Professional and Agency template plans.
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
              A few practical details.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Still deciding? Here are the basics.
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
