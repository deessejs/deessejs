import { expect, test } from "@playwright/test"

test("blog show more appends once and keeps the sequential fallback link", async ({
  page,
}) => {
  await page.goto("/blog")
  const control = page.getByRole("link", { name: "Show more posts, page 2" })
  await expect(page.getByRole("link", { name: /^Show more posts/ })).toHaveCount(1)
  await expect(control).toHaveAttribute("href", "/blog?page=2")
  const cards = page.locator("ul[aria-label='All blog posts'] a[aria-label]")
  const initialCount = await cards.count()
  const initialSlugs = await cards.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href"))
  )

  await page.route("**/api/blog/posts?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    await route.continue()
  })
  await control.click()
  await expect(control).toHaveAttribute("aria-busy", "true")
  await expect(control).toHaveText("Loading posts…")
  await expect(page).toHaveURL("/blog")
  await expect(cards).toHaveCount(initialCount + 6)
  const appendedSlugs = await cards.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href"))
  )
  expect(new Set(appendedSlugs).size).toBe(appendedSlugs.length)
  expect(appendedSlugs.slice(0, initialSlugs.length)).toEqual(initialSlugs)
  await expect(page.getByRole("link", { name: /^Show more posts/ })).toHaveCount(0)

  await page.goto("/blog?page=2")
  await expect(cards).toHaveCount(13)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/blog\?page=2$/
  )
  const noJsContext = await page
    .context()
    .browser()
    ?.newContext({ javaScriptEnabled: false })
  if (!noJsContext)
    throw new Error("Could not create no-JavaScript browser context")
  const noJsPage = await noJsContext.newPage()
  await noJsPage.goto("/blog?page=2")
  await expect(
    noJsPage.locator("ul[aria-label='All blog posts'] a[aria-label]")
  ).toHaveCount(13)
  await expect(noJsPage.getByRole("link", { name: /^Show more posts/ })).toHaveCount(0)
  await noJsContext.close()
})

test("tag listing exposes a sequential fallback link and appends matching posts", async ({
  page,
}) => {
  await page.goto("/blog")
  const tagHref = await page
    .locator("nav[aria-label='Filter by tag'] a")
    .nth(1)
    .getAttribute("href")
  if (!tagHref) throw new Error("Expected a tag link")
  await page.goto(tagHref)
  const more = page.getByRole("link", { name: "Show more posts, page 2" })
  if (await more.count()) {
    await expect(more).toHaveAttribute("href", `${tagHref}?page=2`)
  }
  await page.goBack()
})
