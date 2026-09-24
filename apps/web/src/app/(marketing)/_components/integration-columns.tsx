import {
  INTEGRATION_GROUP_LABELS,
  type Integration,
} from "@/lib/marketing/home-data"

/**
 * Three-column integration logo wall grouped by category
 * (Frameworks / Providers / AI agents).
 *
 * The grouping is performed by the caller: this component receives
 * the full list plus an ordered `groups` array, so display order is
 * decoupled from data shape. Logos live in `public/logos/*.svg` (CC0
 * via simple-icons). `dark:invert` is applied to keep monochrome
 * marks legible in dark mode.
 */
export function IntegrationColumns({
  integrations,
  groups = INTEGRATION_GROUP_LABELS,
}: {
  integrations: ReadonlyArray<Integration>
  groups?: ReadonlyArray<{ key: string; label: string }>
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y divide-border md:divide-y-0 md:divide-x">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-4 p-5 lg:p-6">
          <p className="text-label-13 text-muted-foreground uppercase tracking-wide">
            {group.label}
          </p>
          <ul className="flex flex-col gap-3">
            {integrations
              .filter((integration) => integration.group === group.key)
              .map((integration) => (
                <li
                  key={`${integration.group}-${integration.name}`}
                  className="inline-flex items-center gap-3 text-copy-14 text-foreground"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/logos/${integration.logo}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 dark:invert"
                    aria-hidden
                  />
                  {integration.name}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
