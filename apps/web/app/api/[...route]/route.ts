import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// Edgeランタイム（世界中のCDNで爆速で動くモード）を有効化
export const runtime = 'edge';

// Honoのアプリを初期化（すべてのAPIのURLが /api から始まるように設定）
const app = new Hono().basePath('/api');

// テスト用のルート (GET /api/hello)
app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono & Bun!',
    timestamp: new Date().toISOString(),
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
