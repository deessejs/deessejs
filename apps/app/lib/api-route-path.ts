import { API_BASE_PATH } from "@workspace/api/base-path"

/** Map public root aliases to the path understood by the Hono API mount. */
export const getApiRequestPath = (pathname: string): string => {
  if (pathname === "/schema/project/v1.json")
    return `${API_BASE_PATH}/schema/project/v1.json`

  const metadataPrefix = "/.well-known/oauth-protected-resource/"
  if (pathname.startsWith(metadataPrefix))
    return `${API_BASE_PATH}${pathname}`

  return pathname
}
