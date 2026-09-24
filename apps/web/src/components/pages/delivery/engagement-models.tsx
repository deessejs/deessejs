import { cn } from "@workspace/ui/lib/utils"

import {
  ENGAGEMENT_MODELS,
  type EngagementModel,
} from "@/lib/delivery/engagement-models"

/**
 * Three engagement formats shown as equal cards.
 *
 * The duration label rides at the top of each card (mono
 * uppercase eyebrow. Gives an instant sense of commitment
 * length. Cards are equal in size on `md:grid-cols-3` so a buyer
 * can't read the layout as "agency is the small one and Sprint
 * is the big one", they're three real choices.
 */
export function EngagementModels() {
  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-6 p-6 lg:p-10">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Engagement models
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            Three structured formats. Pick the one that matches
            where you are.
          </h2>
        </header>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border md:divide-y divide-border">
          {ENGAGEMENT_MODELS.map((model, index) => (
            <EngagementCard
              key={model.id}
              model={model}
              isLast={index === ENGAGEMENT_MODELS.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function EngagementCard({
  model,
  isLast,
}: {
  model: EngagementModel
  isLast: boolean
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-4 p-6 lg:p-8",
        !isLast && "md:border-r md:border-border",
      )}
    >
      <span className="font-mono text-copy-13 uppercase tracking-wider text-muted-foreground">
        {model.name} · {model.duration}
      </span>
      <p className="text-copy-14 text-foreground [&:not(:first-child)]:mt-0">
        {model.audience}
      </p>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {model.scope}
      </p>
      <p className="text-copy-14 font-medium text-foreground [&:not(:first-child)]:mt-0">
        {model.deliverable}
      </p>
    </li>
  )
}
