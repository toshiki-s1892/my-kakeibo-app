import { config } from 'dotenv';
import { createClient } from '@libsql/client';

// 環境変数読み込み
config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function test() {
  try {
    // マイグレーション履歴テーブルの構造を確認
    const result = await client.execute('PRAGMA table_info(__drizzle_migrations);');
    console.log('Table structure:');
    console.log(result.rows);

    // テーブル一覧を確認
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('\nAll tables:');
    console.log(tables.rows);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
