---
name: db-migrate
description: Apply DB schema changes to Turso using Drizzle Kit.
---

Apply DB schema changes to Turso using Drizzle Kit.

```bash
cd packages/db && npx drizzle-kit generate && npx drizzle-kit push
```

Do not use `drizzle-kit migrate` — it hangs due to a transaction-compatibility issue with Turso's libsql HTTP driver (see [stack.md](../../../docs/architecture/decisions/stack.md#マイグレーション運用drizzle-kit-generate--pushmigrateは不採用)).
