import { describe, expect, it } from "vitest"
import { hasActiveTemplateImageReferences } from "../../src/core/templates/images.js"

describe("template image reference lifecycle", () => {
  it("keeps a pending publication snapshot ready when the working image changes", () => {
    expect(
      hasActiveTemplateImageReferences({
        working: false,
        currentPublication: false,
        pendingPublication: true,
      })
    ).toBe(true)
  })

  it("keeps an image while a current publication or working template references it", () => {
    expect(
      hasActiveTemplateImageReferences({
        working: false,
        currentPublication: true,
        pendingPublication: false,
      })
    ).toBe(true)
    expect(
      hasActiveTemplateImageReferences({
        working: true,
        currentPublication: false,
        pendingPublication: false,
      })
    ).toBe(true)
  })

  it("allows cleanup only after every active reference is detached", () => {
    expect(
      hasActiveTemplateImageReferences({
        working: false,
        currentPublication: false,
        pendingPublication: false,
      })
    ).toBe(false)
  })
})
