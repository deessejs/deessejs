---
name: feedback-user-perspective-reasoning
description: User wants feature analysis framed from the end-user's perspective (what does this give ME), not just technical specs
metadata:
  type: feedback
---

When designing or analyzing a feature, frame the explanation from the **end-user's perspective** — "what does this give me as a user" — rather than only the technical/architectural view.

**Why:** User explicitly confirmed this preference on 2026-06-25 after I delivered the admin feature recap that way ("j'adore en fait ce raisonnement où je me mets en tant qu'user, on va garder ça dans la futur"). The pattern works well for them because they're a founder/PM — they think in terms of user value first, then validate the technical implementation makes sense. Pure architecture docs answer "is this well-built"; user-perspective framing answers "is this useful".

**How to apply:**

- After completing a feature design or analysis, deliver a **user-perspective summary** in addition to the technical details. Structure as:
  - One-paragraph TL;DR in user voice ("here's what this gives you")
  - Concrete daily-use scenarios ("when X happens, you do Y in 5 seconds")
  - What's NOT included (so they don't expect it)
  - Strategic value (what this unlocks for the next phase)
- Speak to them as a peer user, not as an architect explaining to a junior. Use the second person: "tu gères", "tu fais", "tu vois".
- Don't sacrifice technical depth — the user also wants that. The user-perspective is a SUPPLEMENT, not a replacement.
- This works particularly well for: feature recaps, design decision summaries, scope explanations, "what's in this for me" questions.
- Less relevant for: pure code review, debugging sessions, research tasks, where technical-first is the right frame.

Related: [[user-role-product]] — founder/PM context that motivates this preference.
