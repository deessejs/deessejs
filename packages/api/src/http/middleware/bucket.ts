/**
 * Per-IP rate-limit bucket. Owns the rolling count and the time at
 * which the window resets. Internal to the rate-limit middleware —
 * callers should not import this type directly.
 */
export type Bucket = { count: number; resetAt: number }
