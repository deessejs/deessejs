import { Badge } from "@workspace/ui/components/ui/badge"

// Same editorial frame as the other homepage sections.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl border-x border-foreground/15 px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

/**
 * HomeInteractiveDemo — placeholder for the future InteractiveFiletree.
 *
 * The real InteractiveFiletree (Motion-powered, monorepo tree + paired
 * code panels) is deferred to v0.2. This static 2-up frame establishes
 * the visual shape the real component will fill.
 */
export function HomeInteractiveDemo() {
  return (
    <section id="demo" className={sectionPadding}>
      <div className={bodyContainerClass}>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Coming soon — v0.2
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            The InteractiveFiletree — the visual centerpiece of the landing
            page — will render the monorepo as a monospaced tree with paired
            code panels. This is a static placeholder for layout.
          </p>
        </div>

        {/* Static 2-up frame in the shape the real component will take */}
        <div className="mt-12 overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
          <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
            <div className="bg-background p-6 font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground">{"// monorepo tree"}</div>
              <div className="mt-3 text-foreground">
                <div>complete-template/</div>
                <div className="pl-4">├── apps/</div>
                <div className="pl-8">│   ├── web/</div>
                <div className="pl-8">│   └── cloud/</div>
                <div className="pl-4">└── packages/</div>
                <div className="pl-8 text-foreground/60">└── ui/</div>
              </div>
            </div>
            <div className="bg-background p-6 font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground">{"// selected file"}</div>
              <div className="mt-3 space-y-1 text-foreground">
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    1
                  </span>
                  <span>import {"{ Button }"} from </span>
                  <span className="text-foreground/80">"@workspace/ui"</span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    2
                  </span>
                  <span></span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    3
                  </span>
                  <span>export default function Home() {"{"}</span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    4
                  </span>
                  <span>{"  "}return (</span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    5
                  </span>
                  <span>{"    "}&lt;Button&gt;Get started&lt;/Button&gt;</span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    6
                  </span>
                  <span>{"  "})</span>
                </div>
                <div>
                  <span className="mr-3 inline-block w-4 text-right text-muted-foreground">
                    7
                  </span>
                  <span>{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
