---
"@workspace/auth": patch
"@workspace/database": patch
---

Renames the physical `deviceCode` table to `device_code` and restores a reliable `auth:generate` workflow. The TypeScript export keeps its PascalCase name `deviceCode` for consumer ergonomics; only the SQL identifier changes. Migration `0002_rename_device_code.sql` is metadata-only (PostgreSQL's `ALTER TABLE … RENAME` preserves indexes, constraints, and FKs in lock-step), so the existing data, unique constraints on `device_code` and `user_code`, the `user_id` FK with cascade delete, and the `deviceCode_userId_idx` / `deviceCode_expiresAt_idx` indexes all survive. The `auth:generate` script (which previously exited 1 with a long-form comment) is now a deterministic Node script at `packages/auth/scripts/generate-schema.mjs` that runs `auth generate` and re-applies the application-specific additions (named uniques, named FK with cascade delete, bigint polling_interval, status default, created_at / updated_at columns, indexes on `user_id` and `expires_at`). The script exits 0 when the committed schema file matches the generator output and 1 with a diff otherwise. Two consecutive runs confirm determinism.
