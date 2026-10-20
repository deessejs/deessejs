/**
 * Post-response scheduling for the detached invitation dispatch.
 *
 * The Better Auth `sendInvitationEmail` callback must return without
 * waiting for SMTP: Better Auth documents that callback as a
 * fire-and-forget hook, and awaiting the transport would add the
 * SMTP round trip to the latency of every invitation creation
 * request.
 *
 * Returning early is not the same as abandoning the work. On a
 * serverless platform the function instance is frozen (and can be
 * reclaimed) as soon as the response is flushed, so a bare detached
 * promise can be killed mid-flight and the invitation email is
 * silently lost. The host runtime has to be told that the request
 * is not finished until the task settles.
 *
 * `@workspace/auth` cannot do that itself: the mechanism is
 * framework-specific (`after()` on Next.js, `waitUntil()` on the
 * Vercel functions runtime), and the only other consumer of this
 * package is the published CLI, which does not depend on Next at
 * all. So the host installs its own scheduler.
 *
 * The default is a plain detached promise, which is correct for a
 * long-lived Node process and is what the CLI and any script get.
 */

/**
 * Runs `task` at the earliest point the host allows, given that the
 * response has already been produced.
 *
 * The scheduler is responsible for keeping the runtime alive long
 * enough for `task` to settle. It is **not** responsible for
 * handling `task`'s rejection: callers pass a task that already
 * carries its own `.catch`, so that the error is observed exactly
 * once and never surfaces as an unhandled rejection.
 */
export type PostResponseScheduler = (task: () => Promise<void>) => void

/**
 * Default scheduler: start the task and let the host decide. This is
 * the correct behaviour on a long-lived Node process, where the event
 * loop keeps running after the response. It is also the fallback used
 * when the host scheduler cannot register the task (see
 * `apps/app/lib/organization-post-response.ts`).
 */
export const detachedPostResponseScheduler: PostResponseScheduler = (
  task,
) => {
  // `task` carries its own rejection handler by contract, so nothing is
  // dropped here. The `.catch` is a second line of defence rather than
  // an error path: if a caller ever breaks that contract, the failure
  // is already unreportable, and a silent loss beats an unhandled
  // rejection that can tear down the process mid-request and take every
  // other in-flight invitation with it.
  void task().catch(() => undefined)
}

let current: PostResponseScheduler = detachedPostResponseScheduler

/**
 * Install the host's scheduler. Called once at module load by the
 * application that owns the request lifecycle (`apps/app`). A later
 * call replaces the previous one, which is what lets tests install a
 * recording scheduler and restore the default afterwards.
 */
export function setPostResponseScheduler(
  scheduler: PostResponseScheduler,
): void {
  current = scheduler
}

/**
 * Hand `task` to the installed scheduler. Never throws and never
 * returns a promise the caller should await: the contract is that the
 * caller has already made `task` safe to abandon.
 */
export function schedulePostResponse(task: () => Promise<void>): void {
  current(task)
}