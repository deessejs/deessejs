---
"create-deesse-app": patch
"@deessejs/cli": patch
---

Put both published packages on an automated two-channel release path, and repair the changeset gate that is supposed to protect them.

`create-deesse-app` is now published by the pipeline rather than by hand. Every merge to `staging` publishes both packages under `@canary`; the version bump is persisted by an auto-merged "Version Packages" pull request instead of being computed on the runner and discarded; every merge to `main` publishes whichever packages moved ahead of npm, with one GitHub Release per published version.

This is a packaging and CI change. No runtime behaviour of either package differs. The initializer's version is aligned to what the registry already serves (`0.5.7`) so the first automated publish cannot move the `latest` dist-tag backwards, and `@deessejs/cli` is aligned to its published `2.2.0`, which the repository had been trailing.

The changeset gate itself was repaired. It had never fired: a shallow `git fetch` destroyed the merge base before the path diff, so `git diff` failed, `|| true` turned that into "no files changed", and both validation steps were skipped on every pull request since. The frontmatter matcher compared quoted package names against unquoted ones and so matched nothing. Both halves failed in the same direction, which is why the job looked green.