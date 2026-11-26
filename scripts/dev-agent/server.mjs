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
import {
  LOCAL_R2_PORT_RANGE,
  LOCAL_R2_S3_PATH,
  loadOrCreateLocalR2State,
  localR2RuntimeEnvironment,
  preferredLocalR2Port,
  writeLocalR2WranglerConfig,
} from "./local-r2.mjs"

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

async function startLocalR2Service({ context, values, worktreeId, port, state }) {
  const config = writeLocalR2WranglerConfig({
    localDir: context.localDir,
    worktreeId,
    state,
    port: port.port,
  })
  const child = context.spawnChild(
    "pnpm",
    [
      "exec",
      "wrangler",
      "dev",
      "--config",
      config.configPath,
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port.port),
      "--persist-to",
      config.persistencePath,
    ],
    {
      cwd: context.root,
      env: context.localEnv(values),
      stdio: "inherit",
      detached: process.platform !== "win32",
    }
  )
  let spawnError = null
  child.once("error", (error) => {
    spawnError = error
  })
  const endpoint = `http://127.0.0.1:${port.port}`
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (spawnError) {
      throw new Error(`Could not start Wrangler local R2: ${spawnError.message}`)
    }
    if (child.exitCode !== null) {
      throw new Error(`Wrangler local R2 exited during startup with code ${child.exitCode}.`)
    }
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(1000),
      })
      if (
        response.ok &&
        (await response.text()).includes("dev-agent local R2 is running")
      ) {
        return child
      }
    } catch {
      // Wrangler binds after loading the generated local-only config.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error("Wrangler local R2 did not become ready within 60 seconds.")
}

async function waitForAppReadiness({ context, values, url, portNumber, stopWithFailure }) {
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/v1/ready`, {
        signal: AbortSignal.timeout(2500),
      })
      if (response.ok) {
        if (response.headers.get("x-deesse-worktree") !== context.worktreeId) {
          stopWithFailure(
            `Port ${portNumber} answered readiness for a different worktree. The process was stopped.`
          )
          return
        }
        process.stdout.write(
          "Creating verified local accounts and organization fixtures...\n"
        )
        context.run(
          "pnpm",
          [
            "--dir",
            "packages/database",
            "exec",
            "node",
            "scripts/dev-agent-seed.mjs",
          ],
          context.localEnv(values)
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

async function reuseExistingApp(context, values, preferredPort, enableLocalR2) {
  const url = `http://localhost:${preferredPort}`
  try {
    const response = await fetch(`${url}/api/v1/ready`, {
      signal: AbortSignal.timeout(1500),
    })
    if (
      !response.ok ||
      response.headers.get("x-deesse-worktree") !== context.worktreeId
    ) return false
    if (enableLocalR2) {
      context.fail("This app is already running without the local R2 opt-in. Stop it before starting with --r2-local.")
    }
    context.run("pnpm", ["--dir", "packages/database", "exec", "node", "scripts/dev-agent-seed.mjs"], context.localEnv(values))
    process.stdout.write(`Already ready: ${url}\nBrowser: use T3 preview on environment port ${preferredPort}\n`)
    return true
  } catch {
    // A failed bounded readiness request means the reserved port may be unused.
    return false
  }
}

async function configureLocalR2(context, values, worktreePort) {
  const { worktreeId, localDir, fail } = context
  let port = null
  try {
    const state = loadOrCreateLocalR2State({ localDir, worktreeId })
    port = await reservePort(context, preferredLocalR2Port(worktreeId), LOCAL_R2_PORT_RANGE)
    const config = writeLocalR2WranglerConfig({ localDir, worktreeId, state, port: port.port })
    const appEnvironment = localR2RuntimeEnvironment(context.localEnv(values), config.state, worktreeId, localDir)
    return { port, state: config.state, appEnvironment }
  } catch (error) {
    if (port) {
      closeSync(port.lockFd)
      unlinkSync(port.lockPath)
    }
    closeSync(worktreePort.lockFd)
    unlinkSync(worktreePort.lockPath)
    fail(error instanceof Error ? error.message : String(error))
  }
}

async function startServer(context, args) {
  const { root, worktreeId, localEnv } = context
  const values = await context.prepare({ reset: args.includes("--reset-db") })
  const enableLocalR2 = args.includes("--r2-local")
  const preferredPort = Number(values.DEV_AGENT_PORT)
  if (await reuseExistingApp(context, values, preferredPort, enableLocalR2)) return

  const port = await reservePort(context, preferredPort)
  values.DEV_AGENT_PORT = String(port.port)
  context.persistPort(values.DEV_AGENT_PORT)

  const portNumber = port.port
  const url = `http://localhost:${portNumber}`
  let localR2Port = null
  let appEnvironment = localEnv(values)
  let localR2State = null
  if (enableLocalR2) {
    const localRuntime = await configureLocalR2(context, values, port)
    localR2Port = localRuntime.port
    localR2State = localRuntime.state
    appEnvironment = localRuntime.appEnvironment
  }
  await startApplication(context, { root, worktreeId, values, port, portNumber, url, enableLocalR2, localR2Port, localR2State, appEnvironment })
}

async function startApplication(context, state) {
  const { root, worktreeId, values, port, portNumber, url, enableLocalR2, localR2Port, localR2State, appEnvironment } = state
  const { fail, spawnChild } = context
  let localR2Child = null
  process.stdout.write(
    enableLocalR2
      ? `Starting app and API at ${url} with worktree-local R2 at http://127.0.0.1:${localR2Port.port}${LOCAL_R2_S3_PATH}\n`
      : `Starting app and API at ${url}\n`
  )
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
  if (enableLocalR2) nextCommand.push("--webpack")
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
  let localR2PortReleased = false
  const releaseLocalR2Port = () => {
    if (!localR2Port || localR2PortReleased) return
    localR2PortReleased = true
    closeSync(localR2Port.lockFd)
    try {
      unlinkSync(localR2Port.lockPath)
    } catch (error) {
      if (error?.code !== "ENOENT") {
        fail(`Could not release local R2 port lock ${localR2Port.lockPath}: ${error.message}`)
      }
    }
  }
  const stopProcess = (target, signal = "SIGTERM") => {
    if (!target || target.exitCode !== null) return
    try {
      if (target.pid && process.platform !== "win32")
        process.kill(-target.pid, signal)
      else target.kill(signal)
    } catch (error) {
      if (error?.code !== "ESRCH") throw error
    }
  }
  const stopLocalR2 = async () => {
    if (!localR2Child) {
      releaseLocalR2Port()
      return
    }
    const target = localR2Child
    if (target.exitCode === null) {
      stopProcess(target)
      await Promise.race([
        new Promise((resolve) => target.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
      if (target.exitCode === null) {
        const exited = new Promise((resolve) => target.once("exit", resolve))
        stopProcess(target, "SIGKILL")
        await Promise.race([
          exited,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ])
      }
    }
    releaseLocalR2Port()
  }
  if (enableLocalR2) {
    try {
      localR2Child = await startLocalR2Service({
        context,
        values,
        worktreeId,
        port: localR2Port,
        state: localR2State,
      })
    } catch (error) {
      await stopLocalR2()
      releasePort()
      fail(error instanceof Error ? error.message : String(error))
    }
  }
  const launchApp = () => {
    const launched = spawnChild("pnpm", nextCommand, {
      cwd: root,
      env: appEnvironment,
      stdio: "inherit",
      detached: process.platform !== "win32",
    })
    let settled = false
    const complete = async (code, spawnError = null) => {
      if (settled) return
      settled = true
      if (shutdownSignal) {
        await stopLocalR2()
        releasePort()
        process.exit(shutdownSignal === "SIGINT" ? 130 : 143)
      }
      if (spawnError) {
        await stopLocalR2()
        releasePort()
        fail(`Could not start Next.js: ${spawnError.message}`)
      }
      if (failureAfterStop) {
        if (forceStopTimer) clearTimeout(forceStopTimer)
        await stopLocalR2()
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
      await stopLocalR2()
      releasePort()
      process.exit(code ?? 1)
    }
    launched.once("error", (error) => complete(null, error))
    launched.once("exit", (code) => complete(code))
    return launched
  }
  child = launchApp()
  const stop = () => {
    stopProcess(child)
    stopProcess(localR2Child)
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
  if (localR2Child) {
    localR2Child.once("exit", (code) => {
      if (!shutdownSignal && !failureAfterStop && child?.exitCode === null) {
        stopWithFailure(`Wrangler local R2 exited unexpectedly with code ${code ?? 1}.`)
      }
    })
  }

  await waitForAppReadiness({ context, values, url, portNumber, stopWithFailure })
}

async function reservePort(context, preferredPort, range = { start: 41000, end: 50999 }) {
  const portsDir = path.join(context.localDir, "ports")
  mkdirSync(portsDir, { recursive: true, mode: 0o700 })
  const span = range.end - range.start + 1
  for (let offset = 0; offset < span; offset += 1) {
    const candidate = range.start + ((preferredPort - range.start + offset + span) % span)
    const reservation = await reserveCandidate(candidate, context)
    if (reservation === "retry") {
      offset -= 1
      continue
    }
    if (reservation) return reservation
  }
  context.fail(
    `No free development port was found in the worktree port range ${range.start}-${range.end}.`
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
