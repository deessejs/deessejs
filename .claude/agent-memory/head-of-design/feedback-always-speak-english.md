---
name: feedback-always-speak-english
description: All code — including comments — must be in English, regardless of the user's language in conversation. Messages to the user can be in their language
metadata:
  type: feedback
---

# Language rule: code in English, conversation in user's language

**Code (always English):**
- TypeScript / TSX / JSX
- Comments inside code (JSDoc, inline)
- Variable, function, file, folder names
- Commit messages
- PR descriptions
- Type definitions (`type FooId = ...`, interface doc comments)

**Conversation (user's language):**
- All messages to the user, regardless of what language they speak
- Memory files describing user signals can be in English for searchability
- Explanations of design decisions in chat replies

**Why:** The codebase is the source of truth for human + AI contributors. Mixing languages in code (a French JSDoc in a TypeScript file, for example) creates friction for:
- Future AI agents who may be English-tuned
- Non-francophone contributors
- Grep / search consistency

**Memory files** (under `.claude/agent-memory/`) are documented as English-first — they're search-indexed and read across many sessions. The user explicitly confirmed this rule on 2026-06-29 after seeing code/comments drift between the two languages.

**How to apply:**
- When writing a new component, JSDoc must be English (e.g. `/** SectionLabel — small mono uppercase... */`)
- When the user asks "explain this in French", respond in French but DO NOT rewrite the code comments to French
- If reviewing existing code that has non-English comments, flag it for translation in a follow-up PR (not a silent rewrite in the current task)

**Edge case:** variable names. Even if a feature's name comes from French (e.g. "Pourquoi Choisir" → would become a route /pricing), the URL slug stays English (`/why-different`), and any TS identifier is English (`whyDifferentCards`).
