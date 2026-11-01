import { expect, test } from "@playwright/test"

test("blog pagination appends, restores through history, and has a crawlable URL", async ({
  page,
}) => {
  await page.goto("/blog")
  const loadMore = page.getByRole("link", { name: "Load blog posts page 2" })
  await expect(loadMore).toHaveAttribute("href", "/blog?page=2")
  const initialCards = await page
    .locator("a[aria-label]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label"))
    )

  await loadMore.click()
  await expect(page).toHaveURL(/\/blog\?page=2$/)
  await expect(
    page.getByRole("link", { name: "Load blog posts page 3" })
  ).toBeVisible()
  const appendedCards = await page
    .locator("a[aria-label]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label"))
    )
  expect(new Set(appendedCards).size).toBe(appendedCards.length)
  expect(appendedCards.length).toBeGreaterThan(initialCards.length)

  await page.reload()
  await expect(
    page.getByRole("link", { name: "Load blog posts page 3" })
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL("/blog")
  await expect(
    page.getByRole("link", { name: "Load blog posts page 2" })
  ).toBeVisible()
})
