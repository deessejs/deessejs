---
"@workspace/database": patch
---

Renames the physical `deviceCode` table to `device_code` (snake_case). The TypeScript export keeps its PascalCase name `deviceCode` for consumer ergonomics; only the SQL identifier changes. Migration `0002_rename_device_code.sql` is metadata-only (PostgreSQL's `ALTER TABLE … RENAME` preserves indexes, constraints, and FKs in lock-step), so the existing data, unique constraints on `device_code` and `user_code`, the `user_id` FK with cascade delete, the `deviceCode_userId_idx` / `deviceCode_expiresAt_idx` indexes, and the `deviceCode_device_code_unique` / `deviceCode_user_code_unique` / `deviceCode_user_id_user_id_fk` constraint and FK names all survive. The `auth:generate` command is left at its pre-PR form (`pnpm exec auth generate --config ./src/auth.ts --output ../database/src/schema/auth.ts --yes`); any subsequent reconciliation lives in a follow-up PR.
