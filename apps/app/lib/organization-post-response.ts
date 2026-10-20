import "server-only"

import { after } from "next/server"
import {
  detachedPostResponseScheduler,
  setPostResponseScheduler,
} from "@workspace/auth/organization/lifecycle"

/**
 * Keep the invitation email inside the request lifecycle.
 *
 * `packages/auth` hands detached work to a scheduler instead of
 * `void`ing a promise, precisely because a serverless runtime may
 * reclaim the function instance as soon as the response is flushed.
 * This module supplies that scheduler for Next.js.
 *
 * `after()` throws (`E468`) when it is called outside a request
 * scope. That is not a hypothetical: the same callback can run from a
 * background job or a script that imports the auth config without
 * serving a request, and the invitation dispatch must still go out
 * rather than crash the caller. So registration failure falls back to
 * the detached scheduler, which is the correct behaviour on a
 * long-lived process anyway.
 */
export function installNextPostResponseScheduler(): void {
  setPostResponseScheduler((task) => {
    try {
      after(task)
    } catch {
      detachedPostResponseScheduler(task)
    }
  })
}