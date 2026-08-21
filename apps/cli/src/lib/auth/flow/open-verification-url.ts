import open from "open"

/**
 * Open the device-flow verification URL in the OS-default
 * browser (ADR-020). The `open` package handles per-OS
 * dispatch (`open` on macOS, `xdg-open` on Linux,
 * `start` on Windows) plus WSL detection in one line.
 *
 * `wait: false` returns once the child process is spawned
 * (not when the browser closes). The caller does not await
 * the user-facing flow: the user clicks Approve in the
 * browser, the poll loop in the caller resolves.
 */
export const openVerificationUrl = async (url: string): Promise<void> => {
	await open(url, { wait: false })
}
