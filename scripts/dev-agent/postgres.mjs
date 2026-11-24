import { randomBytes } from "node:crypto"
import { spawnSync } from "node:child_process"

import {
  validateTestDatabaseUrl,
  validateWorktreeDatabaseUrl,
} from "./environment.mjs"

const LOOPBACK_ADDRESSES = new Set(["localhost", "127.0.0.1", "::1"])

export function createPostgresManager({
  databaseName,
  databaseRole,
  databaseUrl,
  adminUrl,
  environment,
  spawnSyncImpl = spawnSync,
}) {
  const identity = { databaseName, databaseRole }
  const target = validateWorktreeDatabaseUrl(databaseUrl, identity, adminUrl)
  const targetPort = target.port || "5432"
  const customAdmin = adminUrl ? new URL(adminUrl) : null

  function assertTarget() {
    validateWorktreeDatabaseUrl(databaseUrl, identity, adminUrl)
  }

  function adminPsql(sql, values = {}) {
    assertTarget()
    const input = `${Object.entries(values)
      .map(
        ([key, value]) =>
          `\\set ${key} '${String(value).replaceAll("'", "''")}'`
      )
      .join("\n")}\n${sql}\n`
    const args = ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"]
    let command
    let commandArgs
    let childEnv

    if (customAdmin) {
      const host = customAdmin.hostname.replace(/^\[|\]$/g, "")
      const username = decodeURIComponent(customAdmin.username)
      childEnv = {
        ...environment,
        PGHOST: host,
        PGPORT: targetPort,
        PGUSER: username,
        PGPASSWORD: decodeURIComponent(customAdmin.password),
      }
      command = "psql"
      commandArgs = [
        ...args,
        "-h",
        host,
        "-p",
        targetPort,
        "-U",
        username,
        "-d",
        "postgres",
        "-f",
        "-",
      ]
    } else {
      command = "sudo"
      commandArgs = [
        "-n",
        "-u",
        "postgres",
        "psql",
        ...args,
        "-p",
        targetPort,
        "-d",
        "postgres",
        "-f",
        "-",
      ]
      childEnv = environment
    }

    const result = spawnSyncImpl(command, commandArgs, {
      input,
      encoding: "utf8",
      env: childEnv,
    })
    if (result.error || result.status !== 0) {
      throw new Error(
        "Could not use the PostgreSQL administrator at the validated worktree endpoint. Check DEV_AGENT_PG_ADMIN_URL or non-interactive sudo access."
      )
    }
    return result.stdout.trim()
  }

  function assertLoopbackServer() {
    const listenAddresses = adminPsql(
      "SELECT current_setting('listen_addresses');"
    )
      .split(",")
      .map((address) => address.trim())
    if (
      listenAddresses.length === 0 ||
      listenAddresses.some((address) => !LOOPBACK_ADDRESSES.has(address))
    ) {
      throw new Error(
        "PostgreSQL must listen only on localhost, 127.0.0.1, or ::1."
      )
    }

    const serverPort = adminPsql("SELECT current_setting('port');")
    if (serverPort !== targetPort) {
      throw new Error(
        "The PostgreSQL administrator is connected to a different port than DATABASE_URL."
      )
    }
  }

  function databaseOwner(name = databaseName) {
    return adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${name}';`
    )
  }

  function ensureLocalPostgres(reset = false) {
    assertTarget()
    assertLoopbackServer()
    const existingRole = adminPsql(
      `SELECT 1 FROM pg_roles WHERE rolname = '${databaseRole}';`
    )
    const rolePassword = decodeURIComponent(target.password)
    const escapedPassword = rolePassword.replaceAll("'", "''")
    if (existingRole) {
      adminPsql(
        `ALTER ROLE ${databaseRole} WITH LOGIN PASSWORD '${escapedPassword}';`
      )
    } else {
      adminPsql(
        `CREATE ROLE ${databaseRole} LOGIN PASSWORD '${escapedPassword}';`
      )
    }

    const owner = databaseOwner()
    if (owner && owner !== databaseRole) {
      throw new Error(
        `Database ${databaseName} already exists with a different owner; refusing to use or remove it.`
      )
    }
    if (owner && reset) {
      adminPsql(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`
      )
      adminPsql(`DROP DATABASE ${databaseName};`)
    }
    if (!owner || reset) {
      adminPsql(`CREATE DATABASE ${databaseName} OWNER ${databaseRole};`)
    }
  }

  function createDisposableTestDatabase(testIdentity, baseValues) {
    assertTarget()
    assertLoopbackServer()
    const existingRole = adminPsql(
      `SELECT 1 FROM pg_roles WHERE rolname = '${testIdentity.role}';`
    )
    const existingOwner = databaseOwner(testIdentity.database)
    if (existingRole || existingOwner) {
      throw new Error(
        "Disposable test database identity already exists. Refusing to reuse or remove it."
      )
    }

    const testDatabaseUrl = new URL(baseValues.DATABASE_URL)
    const password = randomBytes(24).toString("base64url")
    testDatabaseUrl.username = testIdentity.role
    testDatabaseUrl.password = password
    testDatabaseUrl.pathname = `/${testIdentity.database}`
    testDatabaseUrl.search = ""
    testDatabaseUrl.hash = ""
    validateTestDatabaseUrl(
      testDatabaseUrl.toString(),
      testIdentity,
      databaseUrl
    )

    let roleCreated = false
    let databaseCreated = false
    try {
      adminPsql(
        `CREATE ROLE ${testIdentity.role} LOGIN PASSWORD '${password}';`
      )
      roleCreated = true
      adminPsql(
        `CREATE DATABASE ${testIdentity.database} OWNER ${testIdentity.role};`
      )
      databaseCreated = true
      if (databaseOwner(testIdentity.database) !== testIdentity.role) {
        throw new Error("Disposable test database owner verification failed.")
      }
    } catch (error) {
      if (
        databaseCreated &&
        databaseOwner(testIdentity.database) === testIdentity.role
      ) {
        adminPsql(`DROP DATABASE ${testIdentity.database};`)
      }
      if (roleCreated && !databaseOwner(testIdentity.database)) {
        adminPsql(`DROP ROLE ${testIdentity.role};`)
      }
      throw error
    }

    return { url: testDatabaseUrl.toString(), owner: testIdentity.role }
  }

  function removeDisposableTestDatabase(testIdentity, expectedOwner) {
    assertTarget()
    const owner = databaseOwner(testIdentity.database)
    if (owner && owner !== expectedOwner) {
      throw new Error(
        "Disposable test database owner changed. Refusing cleanup."
      )
    }
    if (owner) {
      adminPsql(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testIdentity.database}' AND pid <> pg_backend_pid();`
      )
      adminPsql(`DROP DATABASE ${testIdentity.database};`)
    }

    const roleExists = adminPsql(
      `SELECT 1 FROM pg_roles WHERE rolname = '${testIdentity.role}';`
    )
    if (roleExists) {
      if (databaseOwner(testIdentity.database)) {
        throw new Error(
          "Disposable test database still exists. Refusing role cleanup."
        )
      }
      adminPsql(`DROP ROLE ${testIdentity.role};`)
    }
  }

  function removeWorktreeDatabase() {
    assertTarget()
    const owner = databaseOwner()
    if (owner && owner !== databaseRole) {
      throw new Error(
        `Database owner mismatch for ${databaseName}; refusing cleanup.`
      )
    }
    if (owner) {
      adminPsql(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`
      )
      adminPsql(`DROP DATABASE ${databaseName};`)
    }
    const roleExists = adminPsql(
      `SELECT 1 FROM pg_roles WHERE rolname = '${databaseRole}';`
    )
    if (roleExists) adminPsql(`DROP ROLE ${databaseRole};`)
  }

  return {
    adminPsql,
    assertLoopbackServer,
    databaseOwner,
    ensureLocalPostgres,
    createDisposableTestDatabase,
    removeDisposableTestDatabase,
    removeWorktreeDatabase,
  }
}
