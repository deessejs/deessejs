---
name: project-fresh-exa-credit-limits-2026-06-26
description: Exa (the backend behind `fresh search` and `fresh fetch`) hit credit limits on 2026-06-26. Several fetches during Better Auth research returned "exceeded credits." When this happens, document what was blocked and retry next session.
metadata:
  type: project
---

On **2026-06-26**, during the Better Auth research sweep, Exa (the search/fetch backend used by the `fresh` CLI) hit its credit cap. Multiple `fresh search` and `fresh fetch` calls returned: `"You have exceeded your credits limit. Please top up to keep using Exa at dashboard.exa.ai"`.

**Why:** Exa bills per request. Heavy research sessions (e.g. 7-10 parallel searches + fetches in one turn) can exhaust a daily/monthly quota.

**How to apply:**
- When Exa returns this error mid-research, **don't retry immediately** — the cap is likely account-wide, not per-call.
- Mark the blocked fetches as **[non vérifié]** in the analysis output so the user knows what's confirmed vs. inferred.
- Try alternative mirrors: GitHub raw (`raw.githubusercontent.com/...`), the project's `llms.txt` file, mintlify mirrors.
- If the research is critical and partial, save the partial findings to memory with explicit gaps flagged, and re-verify in a future session.
- The Cloud tech-lead's working agreement says "use `fresh` CLI for web research" — this doesn't change. But it's worth noting that Exa has capacity limits.

**What worked on 2026-06-26:** the `better-auth-better-auth-16.mintlify.app/` mirror succeeded for the introduction page even when `better-auth.com/docs/introduction` failed. So mintlify-hosted project mirrors are a viable fallback.

**What to try in future sessions:**
1. Reschedule heavy research sweeps to spread across multiple turns (fewer calls per turn).
2. Check Exa dashboard for current credit state before kicking off big sweeps.
3. Have a fallback plan: `llms.txt` index files are designed for LLM consumption and usually well-cached.

Related: [[research-snapshot-2026-06-26]] (snapshot of what was verified on this date, gaps clearly marked)