/**
 * Promisified setTimeout.
 *
 * Used by the deesse auth login polling loop to wait between
 * polls of /device/token. The loop's total timeout (1800 seconds
 * for a device-code TTL, hard-stopped via the mapPollingError
 * table) also uses this helper — there is no second timing
 * mechanism.
 *
 * Implemented with `node:timers/promises` so we do not pull in
 * a third-party timing lib for one helper. The Node API has
 * been stable since Node 15.
 *
 * One file, one function. Helpers stay scoped to their file.
 */
import { setTimeout as nodeSetTimeout } from "node:timers/promises"

export const sleep = (ms: number): Promise<void> => nodeSetTimeout(ms)
