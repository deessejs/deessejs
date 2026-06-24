import { Code2, Layers, Zap } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

// Same editorial frame as the other homepage sections.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl border-x border-foreground/15 px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

const features = [
  {
    icon: Code2,
    title: "Feature one",
    description:
      "One-line description of what this feature does for the buyer.",
  },
  {
    icon: Layers,
    title: "Feature two",
    description:
      "One-line description of what this feature does for the buyer.",
  },
  {
    icon: Zap,
    title: "Feature three",
    description:
      "One-line description of what this feature does for the buyer.",
  },
]

/**
 * HomeFeatures — 3-up grid of feature cards.
 *
 * Section header (h2 + subhead) on top, then a responsive grid:
 * 1 col on mobile, 2 cols on sm, 3 cols on lg.
 *
 * Dummy data. Replace with the real feature inventory when the
 * marketing content is finalized.
 */
export function HomeFeatures() {
  return (
    <section
      id="features"
      className={`${sectionPadding} bg-muted/30`}
    >
      <div className={bodyContainerClass}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Section title goes here
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Optional subtitle that frames the value of the section.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="size-5 text-foreground" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
