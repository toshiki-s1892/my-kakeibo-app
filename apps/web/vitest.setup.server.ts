import { migrate } from 'drizzle-orm/libsql/migrator';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// :memory:はdb.transaction()のコミットが反映されない既知のlibsqlバグがあるため使わない
// (https://github.com/tursodatabase/libsql-client-ts/issues/140)。テストごとの使い捨てファイルDBを
// プロジェクト内（.gitignore対象）に作る
const TEST_DB_DIR = join(process.cwd(), '.tmp-test-db');
let dbFile: string;

beforeEach(async () => {
  mkdirSync(TEST_DB_DIR, { recursive: true });
  dbFile = join(TEST_DB_DIR, `${randomUUID()}.db`);
  process.env.DATABASE_URL = `file:${dbFile}`;

  // キャッシュ情報をクリアして、DBをテストごとに空にする
  vi.resetModules();
  // 新しいファイルDBへの接続を作成する
  const { db } = await import('@/server/lib/db');
  // migrateを実行し、テーブルを作成する
  await migrate(db, { migrationsFolder: '../../packages/db/migrations' });
});

afterEach(() => {
  rmSync(dbFile, { force: true });
});
