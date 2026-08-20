export { authClient } from "./better-auth-client.js"
export { bearerFetch } from "./bearer-fetch.js"
export {
	readAuth,
	writeAuth,
	clearAuth,
	authPath,
	authPath as AUTH_PATH,
	CACHE_DIR,
} from "./store.js"
export type { StoredAuth } from "./store.js"
