import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"

const [tarball, expectedName, expectedVersion, ...requiredFiles] = process.argv.slice(2)

if (!tarball || !expectedName || !expectedVersion || requiredFiles.length === 0) {
  console.error(
    "Usage: node scripts/verify-npm-tarball.mjs <tarball> <name> <version> <required-file...>"
  )
  process.exit(2)
}

if (!existsSync(tarball)) {
  console.error(`Tarball does not exist: ${tarball}`)
  process.exit(1)
}

const files = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
const fileSet = new Set(files)
const missingFiles = requiredFiles.filter((file) => !fileSet.has(file))

if (missingFiles.length > 0) {
  console.error("Tarball is missing required files:")
  for (const file of missingFiles) console.error(`- ${file}`)
  process.exit(1)
}

const manifest = JSON.parse(
  execFileSync("tar", ["-xzOf", tarball, "package/package.json"], {
    encoding: "utf8",
  })
)

if (manifest.name !== expectedName) {
  console.error(`Expected package name ${expectedName}, got ${manifest.name}`)
  process.exit(1)
}

if (manifest.version !== expectedVersion) {
  console.error(`Expected package version ${expectedVersion}, got ${manifest.version}`)
  process.exit(1)
}

const offenders = []
for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
  for (const [name, value] of Object.entries(manifest[section] ?? {})) {
    if (
      typeof value === "string" &&
      (value === "catalog:" || value.startsWith("workspace:"))
    ) {
      offenders.push(`${section}.${name} = ${JSON.stringify(value)}`)
    }
  }
}

if (offenders.length > 0) {
  console.error("Packaged manifest contains pnpm-only dependency protocols:")
  for (const offender of offenders) console.error(`- ${offender}`)
  process.exit(1)
}

console.log(`Verified ${expectedName}@${expectedVersion} in ${tarball}`)
