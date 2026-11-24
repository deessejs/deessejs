import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import net from "node:net"
import path from "node:path"
import process from "node:process"

export function createDevelopmentServer(context) {
  return { start: (args) => startServer(context, args) }
}

function freePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)))
  })
}

function processStartTime(pid) {
  if (process.platform !== "linux") return null
  try {
    // /proc/<pid>/stat field 22 distinguishes a live original owner from a reused PID.
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
    const fields = stat
      .slice(stat.lastIndexOf(")") + 2)
      .trim()
      .split(/\s+/)
    return fields[19]
  } catch {
    // The process may exit between the caller's liveness check and this read.
    return null
  }
}

async function startServer(context, args) {
  const {
    root,
    worktreeId,
    fail,
    prepare,
    localEnv,
    run,
    spawnChild,
    persistPort,
  } = context
  const reset = args.includes("--reset-db")
  const values = await prepare({ reset })
  const preferredPort = Number(values.DEV_AGENT_PORT)
  const existingUrl = `http://localhost:${preferredPort}`
  try {
    const response = await fetch(`${existingUrl}/api/v1/ready`, {
      signal: AbortSignal.timeout(1500),
    })
    if (
      response.ok &&
      response.headers.get("x-deesse-worktree") === worktreeId
    ) {
      run(
        "pnpm",
        [
          "--dir",
          "packages/database",
          "exec",
          "node",
          "scripts/dev-agent-seed.mjs",
        ],
        localEnv(values)
      )
      process.stdout.write(
        `Already ready: ${existingUrl}\nBrowser: use T3 preview on environment port ${preferredPort}\n`
      )
      return
    }
  } catch {
    // A failed bounded readiness request means the reserved port may be unused.
  }

  const port = await reservePort(context, preferredPort)
  values.DEV_AGENT_PORT = String(port.port)
  persistPort(values.DEV_AGENT_PORT)

  const portNumber = port.port
  const url = `http://localhost:${portNumber}`
  process.stdout.write(`Starting app and API at ${url}\n`)
  const nextCommand = [
    "--filter",
    "app",
    "exec",
    "next",
    "dev",
    "--hostname",
    "0.0.0.0",
    "--port",
    String(portNumber),
  ]
  const nextRetryDirs = [
    path.join(root, "apps/app/.next/cache/next-agentic-upgrade-retries"),
    path.join(root, "apps/app/.next/dev/cache/next-agentic-upgrade-retries"),
  ]
  const readUpgradeRetryFiles = () =>
    new Set(
      nextRetryDirs.flatMap((dir) => {
        try {
          return readdirSync(dir).map((file) => path.join(dir, file))
        } catch {
          return []
        }
      })
    )
  const retryFilesBefore = readUpgradeRetryFiles()
  let child
  let retryUsed = false
  let portReleased = false
  let shutdownSignal = null
  let failureAfterStop = null
  let forceStopTimer = null
  const releasePort = () => {
    if (portReleased) return
    portReleased = true
    closeSync(port.lockFd)
    try {
      unlinkSync(port.lockPath)
    } catch (error) {
      if (error?.code !== "ENOENT") {
        fail(`Could not release port lock ${port.lockPath}: ${error.message}`)
      }
    }
  }
  const launchApp = () => {
    const launched = spawnChild("pnpm", nextCommand, {
      cwd: root,
      env: localEnv(values),
      stdio: "inherit",
      detached: process.platform !== "win32",
    })
    let settled = false
    const complete = (code, spawnError = null) => {
      if (settled) return
      settled = true
      if (shutdownSignal) {
        releasePort()
        process.exit(shutdownSignal === "SIGINT" ? 130 : 143)
      }
      if (spawnError) {
        releasePort()
        fail(`Could not start Next.js: ${spawnError.message}`)
      }
      if (failureAfterStop) {
        if (forceStopTimer) clearTimeout(forceStopTimer)
        releasePort()
        fail(failureAfterStop)
      }
      const filesAfter = readUpgradeRetryFiles()
      const newUpgradeNotice = [...filesAfter].some(
        (file) => !retryFilesBefore.has(file)
      )
      if (!retryUsed && code === 1 && newUpgradeNotice) {
        retryUsed = true
        process.stdout.write(
          "Next.js printed its security upgrade notice and instructed a retry. Retrying the same command once; no dependency or config upgrade is performed.\n"
        )
        child = launchApp()
        return
      }
      releasePort()
      process.exit(code ?? 1)
    }
    launched.once("error", (error) => complete(null, error))
    launched.once("exit", (code) => complete(code))
    return launched
  }
  child = launchApp()
  const stop = () => {
    try {
      if (child.pid && process.platform !== "win32")
        process.kill(-child.pid, "SIGTERM")
      else child.kill("SIGTERM")
    } catch (error) {
      if (error?.code !== "ESRCH") throw error
    }
  }
  const stopWithFailure = (message) => {
    failureAfterStop = message
    const stoppingChild = child
    stoppingChild.once("exit", () => {
      if (forceStopTimer) clearTimeout(forceStopTimer)
    })
    forceStopTimer = setTimeout(() => {
      if (stoppingChild.exitCode !== null || !stoppingChild.pid) return
      try {
        if (process.platform !== "win32")
          process.kill(-stoppingChild.pid, "SIGKILL")
        else stoppingChild.kill("SIGKILL")
      } catch {
        // The child may already have exited while shutdown was being requested.
      }
    }, 5000)
    stop()
  }
  process.on("SIGINT", () => {
    shutdownSignal = "SIGINT"
    stop()
  })
  process.on("SIGTERM", () => {
    shutdownSignal = "SIGTERM"
    stop()
  })

  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/v1/ready`, {
        signal: AbortSignal.timeout(2500),
      })
      if (response.ok) {
        if (response.headers.get("x-deesse-worktree") !== worktreeId) {
          stopWithFailure(
            `Port ${portNumber} answered readiness for a different worktree. The process was stopped.`
          )
          return
        }
        process.stdout.write(
          "Creating verified local accounts and organization fixtures...\n"
        )
        run(
          "pnpm",
          [
            "--dir",
            "packages/database",
            "exec",
            "node",
            "scripts/dev-agent-seed.mjs",
          ],
          localEnv(values)
        )
        process.stdout.write(
          `Ready: ${url}\nBrowser: use T3 preview on environment port ${portNumber}\nAPI: ${url}/api/v1\nCLI: pnpm dev:agent cli -- template list\nCLI login: pnpm dev:agent cli -- auth login --no-open\n`
        )
        return
      }
    } catch {
      // The app may refuse connections until the next readiness attempt.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  stopWithFailure(
    `Readiness timed out at ${url}/api/v1/ready. Check app output, PostgreSQL, and migrations above.`
  )
}

async function reservePort(context, preferredPort) {
  const portsDir = path.join(context.localDir, "ports")
  mkdirSync(portsDir, { recursive: true, mode: 0o700 })
  const span = 10000
  for (let offset = 0; offset < span; offset += 1) {
    const candidate = 41000 + ((preferredPort - 41000 + offset + span) % span)
    const reservation = await reserveCandidate(candidate, context)
    if (reservation === "retry") {
      offset -= 1
      continue
    }
    if (reservation) return reservation
  }
  context.fail(
    "No free development port was found in the worktree port range 41000-50999."
  )
}

async function reserveCandidate(candidate, context) {
  const { localDir, worktreeId, fail } = context
  const lockPath = path.join(localDir, "ports", `${candidate}.lock`)
  let lockFd
  try {
    lockFd = openSync(lockPath, "wx", 0o600)
  } catch (error) {
    if (error?.code !== "EEXIST") {
      fail(`Could not reserve port ${candidate}: ${error.message}`)
    }
    const stale = removeStaleLock(lockPath, context)
    return stale ? "retry" : null
  }

  if (!(await freePort(candidate))) {
    closeSync(lockFd)
    removeLockFile(lockPath, fail)
    return null
  }
  writeFileSync(
    lockFd,
    `${JSON.stringify({ pid: process.pid, processStartTime: processStartTime(process.pid), worktreeId })}\n`
  )
  return { port: candidate, lockFd, lockPath }
}

function removeStaleLock(lockPath, { worktreeId, fail }) {
  let lock
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8"))
  } catch {
    fail(
      `Port lock ${lockPath} is unreadable. Inspect it and remove it only if its owning process is gone.`
    )
  }
  if (
    !Number.isSafeInteger(lock.pid) ||
    lock.pid < 2 ||
    typeof lock.worktreeId !== "string" ||
    !/^[a-f0-9]{12}$/.test(lock.worktreeId)
  ) {
    fail(
      `Port lock ${lockPath} has invalid owner metadata. Inspect it and remove it only if its owning process is gone.`
    )
  }
  if (processIsAlive(lock)) {
    if (lock.worktreeId === worktreeId) {
      fail(
        `This worktree already has a live startup process (PID ${lock.pid}) reserving port ${path.basename(lockPath, ".lock")}. Check pnpm dev:agent status before starting another.`
      )
    }
    return false
  }
  removeLockFile(lockPath, fail)
  return true
}

function processIsAlive(lock) {
  let alive = true
  try {
    process.kill(lock.pid, 0)
  } catch (error) {
    if (error?.code === "ESRCH") alive = false
  }
  if (
    alive &&
    lock.processStartTime &&
    processStartTime(lock.pid) !== lock.processStartTime
  ) {
    alive = false
  }
  return alive
}

function removeLockFile(lockPath, fail) {
  try {
    unlinkSync(lockPath)
  } catch (error) {
    if (error?.code !== "ENOENT") {
      fail(`Could not remove port lock ${lockPath}: ${error.message}`)
    }
  }
}
