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
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
    });
