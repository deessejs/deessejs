---
name: feedback-no-deep-mode-on-fresh
description: User directive — NEVER use `-t deep` or `-t deep-lite` with fresh search. Default (auto) only. Save the user's Exa credit budget.
metadata:
  type: feedback
---

**Rule:** Never pass `-t deep`, `-t deep-lite`, or `-t deep-reasoning` to `fresh search`. Use the default mode (`auto`) — or `instant` / `fast` if more response time vs depth trade-off is needed.

**Why:** The user pointed this out on 2026-06-26 after I'd run ~7 parallel `fresh search -t deep` calls in a single research sweep. Deep modes trigger many more Exa sub-requests per call than the default. Multiple sessions of deep-mode sweeps in one day hit the Exa credit cap (as recorded in [[project-fresh-exa-credit-limits-2026-06-26]]). Default mode gets usable results at a fraction of the credit cost.

**How to apply:**
- `fresh search -q "..."` (no `-t` flag) — default to this.
- If results feel thin, try `fresh fetch -p "<specific question>" <url>` against the URLs already found, instead of escalating to `-t deep`.
- Only consider `-t deep-reasoning` if the user explicitly asks for it AND the topic is critical.
- When proposing a research sweep, count: 1 deep call ≈ 5-10 default calls in credit cost. Budget accordingly.

Related: [[project-fresh-exa-credit-limits-2026-06-26]] (the incident that surfaced this preference)