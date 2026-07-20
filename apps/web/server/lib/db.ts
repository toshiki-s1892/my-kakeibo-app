import { drizzle } from 'drizzle-orm/libsql';

const isProd = process.env.NODE_ENV === 'production';

export const db = isProd
  ? drizzle({
      connection: {
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
    })
  : drizzle({
      connection: {
        url: process.env.DATABASE_URL ?? 'file:./local.db',
        // DATABASE_URLにTursoのURLを設定するローカル開発運用のため渡す。file:/:memory:では無視される
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
    });
