import { defineSandbox } from "eve/sandbox"
import { defaultBackend } from "eve/sandbox"

/**
 * Independent sandbox for the behavior specialist. No `parent` callback is
 * passed, so eve provisions a fresh sandbox per session rather than sharing
 * the coordinator's. The sandbox has no egress by default; their public
 * network access is mediated by app-runtime tools that proxy results in.
 */
export default defineSandbox({
  backend: defaultBackend({
    vercel: {
      resources: { vcpus: 2 },
      networkPolicy: "deny-all",
    },
    docker: { networkPolicy: "deny-all" },
  }),
})