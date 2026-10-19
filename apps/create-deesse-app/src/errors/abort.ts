// Re-exported here so the import set in pipeline.ts and any
// future caller is symmetric with the rest of the error
// taxonomy. The factory itself lives in `./index.ts` because
// it is a member of the closed `CreateAppErrorCode` union
// (the union is the canonical source of truth for every
// error code; widening it requires editing `./index.ts`).
export { aborted } from "./index.js"
