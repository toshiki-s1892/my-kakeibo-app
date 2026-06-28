Apply DB schema changes to Turso using Drizzle Kit.

```bash
cd packages/db && npx drizzle-kit generate && npx drizzle-kit push
```

`drizzle-kit migrate`はTurso（libsql HTTPドライバ）とのトランザクション互換性問題でハングするため使用しない（詳細は[architecture/decisions/stack.md](../../docs/architecture/decisions/stack.md#マイグレーション運用drizzle-kit-generate--pushmigrateは不採用)参照）。
