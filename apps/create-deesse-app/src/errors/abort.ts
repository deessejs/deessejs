import type { CliError } from "./index.js"

/**
 * Build the `error` literal the pipeline uses when the
 * AbortSignal is fired mid-flight (a SIGINT, a manual
 * `abortController.abort()`, or a tar/fetch cancel). The
 * factory returns a `CliError`-shaped object — the caller
 * destructures it into the `CreateFailure.error` field.
 *
 * Distinct from `internal` because the user-triggered cancel
 * is not a real failure: the staging tempdir has already
 * been cleaned, the destination was never created, and the
 * hint tells the user to simply re-run the command. We use
 * the closed `internal` code (closed by `CreateAppErrorCode`)
 * so the JSON contract stays in sync with the union — a new
 * "aborted" code would be a breaking change for downstream
 * scripts that switch on `error.code`, and the issue does
 * not require it.
 */
export const aborted = (): {
  code: "internal"
  message: string
  hint: string | undefined
} => ({
  code: "internal",
  message: "create-deesse-app was cancelled before completion",
  hint: "re-run the command to retry; the staging tempdir has been cleaned",
})

// Re-exported so the import set in pipeline.ts is symmetric
// with the rest of the error taxonomy.
export type AbortedError = ReturnType<typeof aborted> & CliError
