/**
 * Stable selectors for the /templates surface.
 *
 * The marketing page changes copy often (rebrand, i18n);
 * relying on visible text in a Playwright assertion is a
 * recurring source of flakes. This helper centralises the
 * data-testid + role-based selectors that the e2e suite
 * relies on.
 *
 * See ADR-020 Decision #4 for the rationale on data-testid
 * placement.
 */
import { type Page } from "@playwright/test"

/** H1 heading on the /templates index. */
export const templatesHeading = (page: Page) =>
  page.getByRole("heading", { name: "Templates", level: 1 })

/** Each template card on the index grid. */
export const templatesCard = (page: Page) =>
  page.getByTestId("templates-card")

/** The grid container that wraps the cards. */
export const templatesGrid = (page: Page) =>
  page.getByTestId("templates-grid")

/** Sidebar Type filter group. */
export const sidebarType = (page: Page) =>
  page.getByTestId("templates-sidebar-type")

/** Sidebar Framework filter group. */
export const sidebarFramework = (page: Page) =>
  page.getByTestId("templates-sidebar-framework")

/** Sidebar "N templates in catalog" count summary. */
export const sidebarCount = (page: Page) =>
  page.getByTestId("templates-sidebar-count")

/** Search input in the live-search bar. */
export const searchInput = (page: Page) =>
  page.getByTestId("templates-search")

/** Empty-catalog block (the "No templates available right now" branch). */
export const emptyCatalog = (page: Page) =>
  page.getByTestId("templates-empty")

/** Loading skeleton, present during initial RSC streaming. */
export const loadingSkeleton = (page: Page) =>
  page.getByTestId("templates-loading")

/** Error.tsx UI (the "Couldn't load templates" boundary). */
export const errorHeading = (page: Page) =>
  page.getByRole("heading", { name: "Couldn't load templates" })

/** Error.tsx "Try again" button. */
export const tryAgainButton = (page: Page) =>
  page.getByRole("button", { name: "Try again" })

/** Detail page H1 (template name). */
export const detailHeading = (page: Page, name: string) =>
  page.getByRole("heading", { name, level: 1 })

/** Detail page breadcrumb back-link. */
export const detailBreadcrumb = (page: Page) =>
  page.getByRole("navigation").getByRole("link", { name: "Templates" })

/** Detail page "Install CLI" CTA. */
export const installCliLink = (page: Page) =>
  page.getByRole("link", { name: "Install CLI" })

/** Detail page "View source" CTA. */
export const viewSourceLink = (page: Page) =>
  page.getByRole("link", { name: "View source" })

/** Not-found UI ("Template not found"). */
export const notFoundHeading = (page: Page) =>
  page.getByRole("heading", { name: "Template not found" })

/** Not-found back-link to /templates. */
export const browseAllTemplatesLink = (page: Page) =>
  page.getByRole("link", { name: "Browse all templates" })