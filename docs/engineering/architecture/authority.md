# Authority hierarchy

When sources of truth conflict, this is the priority order. Higher
levels win.

```
1. Compiler / tests / types
        ↓
2. Architecture internals + ADRs (docs/engineering/architecture/decisions/)
        ↓
3. Official documentation of the technology used
        ↓
4. Repository conventions (docs/engineering/architecture/rules/)
        ↓
5. Knowledge base (docs/engineering/architecture/, glossary.md)
        ↓
6. Secondary documentation (tutorials, blogs, Stack Overflow)
        ↓
7. Personal / model knowledge
        ↓
   (lowest)
```

## What each level means

### 1. Compiler / tests / types

The type system is a tool, not a target. If TypeScript says a type is
wrong, the type is wrong, even if the code "works at runtime". A
failing test is a failing test, even if "it's only the snapshot".
The compiler and the test suite are the only things that prove
correctness.

### 2. ADRs

`docs/engineering/architecture/decisions/ADR-NNN-*.md` capture deliberate
decisions. They say "we chose X because Y". They are the law of
this repo. Code that contradicts an ADR is wrong, even if the ADR
itself was wrong at the time. Update the ADR, then the code.

### 3. Official technology documentation

For external libraries, frameworks, and APIs: the official docs
for the version installed in `package.json`. See
`architecture/rules/0006-technology-choices.md` (the durable-assumption
discipline covers the "consult upstream first" practice).

### 4. Repository conventions

`docs/engineering/architecture/rules/` describe how we do things here. The
"why" lives in the rule. If you think the rule is wrong, change
the rule, not the code.

### 5. Knowledge base

`docs/engineering/architecture/` and `glossary.md` describe the
shape of the system. They are descriptive, not prescriptive.
Where they conflict with an ADR, the ADR wins.

### 6. Secondary documentation

Tutorials, blog posts, Stack Overflow answers, AI-generated
explainer text. All of this is **hypothesis**, not source of truth.
Useful for finding questions to ask; dangerous as a source of
answers.

### 7. Personal / model knowledge

"I remember that..." or "the model thinks that..." Both are the
weakest authority. Verify against the higher levels before acting.

## How to resolve a conflict

1. **Identify the conflict.** "I'm using X, but ADR-NNN says Y."
2. **Check the source-of-truth hierarchy.** Does Y match the ADR?
   Does X match the model? The ADR is more authoritative.
3. **Stop and report.** Do not silently choose. The review surfaces
   the conflict.
4. **Update the loser.** Either fix the code (if the ADR is right)
   or update the ADR (if the world changed). Both need a commit.

## Examples in this repo

- **Conflict**: the model suggested using `import { fetch } from
  "..."` inside a server procedure to call GitHub. The
  architecture says procedures don't fetch — that's the service's
  job. Resolution: the model is wrong; the procedure is wrong;
  the architecture wins. Update the procedure to call the service.
- **Conflict**: the model suggested `vi.stubGlobal("fetch", ...)` for
  testing RPCLink. The rule says no. Resolution: the model is
  wrong; the test is wrong; the rule wins. Update the test to use
  `http.createServer` or Server-Side Client.

## Why this hierarchy exists

Without a documented hierarchy, every conflict is settled by who
shouts loudest. With one, every conflict has a default answer that
the reviewer can apply mechanically. The hierarchy is conservative:
we trust the things we control (compiler, tests, our own docs)
over the things we don't (the model's training data).
