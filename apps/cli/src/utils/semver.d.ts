declare module "semver" {
  export function subset(
    sub: string,
    dom: string,
    options?: { includePrerelease?: boolean }
  ): boolean | null
}
