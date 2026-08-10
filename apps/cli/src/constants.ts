/**
 * Default API endpoint. oRPC procedures are POSTed to this URL with a
 * JSON body of shape `{"0":{"json":null,"meta":[]}}`. The server
 * unwraps the body and runs the named procedure.
 */
export const DEFAULT_API_URL =
  "https://app.deessejs.com/api/v1/rpc/templates/list"

export const USER_AGENT = "deessejs-cli/0.1.0 (https://deessejs.com)"

export const EXIT_SUCCESS = 0
export const EXIT_ERROR = 1
