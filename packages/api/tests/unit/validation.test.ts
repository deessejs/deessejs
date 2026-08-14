import { describe, expect, it } from "vitest"
import { z } from "zod"

describe("API validation", () => {
  describe("user input validation", () => {
    it("should validate user creation input", () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })

      // Valid input
      const valid = schema.safeParse({
        name: "John Doe",
        email: "john@example.com",
      })
      expect(valid.success).toBe(true)

      // Invalid email
      const invalidEmail = schema.safeParse({
        name: "John Doe",
        email: "not-an-email",
      })
      expect(invalidEmail.success).toBe(false)

      // Empty name
      const emptyName = schema.safeParse({
        name: "",
        email: "john@example.com",
      })
      expect(emptyName.success).toBe(false)
    })

    it("should validate pagination input", () => {
      const schema = z.object({
        limit: z.number().int().min(1).max(100).optional().default(10),
        offset: z.number().int().min(0).optional().default(0),
      })

      // Default values
      const defaults = schema.safeParse({})
      expect(defaults.success).toBe(true)
      expect(defaults.data?.limit).toBe(10)
      expect(defaults.data?.offset).toBe(0)

      // Custom values
      const custom = schema.safeParse({ limit: 50, offset: 10 })
      expect(custom.success).toBe(true)
      expect(custom.data?.limit).toBe(50)

      // Out of range
      const outOfRange = schema.safeParse({ limit: 200 })
      expect(outOfRange.success).toBe(false)
    })

    it("should validate user ID input", () => {
      const schema = z.object({
        id: z.string(),
      })

      const valid = schema.safeParse({ id: "123" })
      expect(valid.success).toBe(true)

      const missing = schema.safeParse({})
      expect(missing.success).toBe(false)
    })
  })

  describe("response validation", () => {
    it("should validate user response structure", () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      })

      const validUser = {
        id: "123",
        name: "John",
        email: "john@example.com",
      }

      expect(userSchema.safeParse(validUser).success).toBe(true)
    })
  })
})
