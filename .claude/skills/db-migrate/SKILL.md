---
name: db-migrate
description: Apply DB schema changes to Turso using Drizzle Kit.
---

Apply DB schema changes to Turso using Drizzle Kit.

```bash
cd packages/db && npx drizzle-kit generate && npx drizzle-kit migrate
```

Use `migrate` (not `push`): integration tests replay `migrations/*.sql` from scratch, so the applied history in `__drizzle_migrations` must stay consistent with the files. `push` does not record history and let broken migration files go unnoticed in the past (see [stack.md](../../../docs/architecture/decisions/stack.md#マイグレーション運用drizzle-kit-generate--migrate2026-07-20にpush運用から変更)).

Note: an older `migrate` hang with Turso's libsql HTTP driver no longer reproduces as of drizzle-kit 0.31.10 (verified 2026-07-20). If it recurs, check the drizzle-kit version and revisit stack.md.

Report results to the user in Japanese.
