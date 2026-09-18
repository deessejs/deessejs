import { defineAgent, type DefinedAgent } from "eve"
import { minimax } from "vercel-minimax-ai-provider"

/**
 * Root agent for the DeesseJS GitHub bot.
 *
 * Model: MiniMax-M3 (latest M-series, 1M-token context), routed through the
 * `vercel-minimax-ai-provider` community AI SDK package. Reads the API key
 * from the `MINIMAX_API_KEY` env var. See `.env.example`.
 *
 * The explicit `DefinedAgent` return type avoids a `TS2883` from
 * `tsc --noEmit`: the inferred default-export type references
 * `LanguageModelV3` from a hoisted `@ai-sdk/provider`, which is not
 * portable across workspaces.
 */
const agent: DefinedAgent = defineAgent({
  model: minimax("MiniMax-M3"),
})

export default agent
