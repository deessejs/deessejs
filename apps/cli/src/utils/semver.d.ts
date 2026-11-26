declare module "semver" {
  export interface SemVer {
    major: number
    minor: number
    patch: number
    prerelease: Array<string | number>
    build: string[]
    version: string
  }

  export function parse(version: string): SemVer | null

  export function inc(
    version: string,
    release: "major" | "minor" | "patch"
  ): string | null

  export function subset(
    sub: string,
    dom: string,
    options?: { includePrerelease?: boolean }
  ): boolean | null
}
