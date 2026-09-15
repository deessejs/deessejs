// Ambient type declaration for `cross-spawn`.
//
// `cross-spawn@7` ships as pure CommonJS without a TypeScript declaration
// file, which makes `tsc --noEmit` fail with TS7016 under our strict
// typecheck. The shape below mirrors the package's actual runtime
// contract: a function that returns a `ChildProcess`. We intentionally
// narrow the options to the fields our wrapper actually uses rather
// than importing `@types/cross-spawn` (which is unmaintained and tracks
// an older major version).
//
// See `apps/cli/src/utils/spawn.ts` for the call site.
declare module "cross-spawn" {
	import { ChildProcess, SpawnOptions } from "node:child_process"

	export function spawn(
		command: string,
		args?: readonly string[],
		options?: SpawnOptions,
	): ChildProcess

	export function sync(
		command: string,
		args?: readonly string[],
		options?: SpawnOptions,
	): {
		status: number | null
		signal: NodeJS.Signals | null
		output: Array<Buffer | string | null>
		stdout: Buffer | string
		stderr: Buffer | string
		pid: number
		error: Error | null
	}
}