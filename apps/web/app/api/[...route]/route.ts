import '@/lib/zod-locale';
import { authMiddleware, requireUserMiddleware } from '@/server/middleware/auth';
import { requestLogger } from '@/server/middleware/request-logger';
import categoriesRouter from '@/server/routes/categories';
import profileRouter from '@/server/routes/profile';
import { errorHandler } from '@/server/shared/error-handler';
import { clerkMiddleware } from '@clerk/hono';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';
import { handle } from 'hono/vercel';

const app = new OpenAPIHono().basePath('/api');

app.use(requestId());
app.use(requestLogger);
app.use(clerkMiddleware());
app.use('/profile/*', authMiddleware);
app.use('/categories/*', authMiddleware, requireUserMiddleware);

app.route('/profile', profileRouter);
app.route('/categories', categoriesRouter);

app.onError(errorHandler);

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

// 開発者向けのAPIドキュメントは本番では公開しない（存在しないURLと同じ404になる）
if (process.env.NODE_ENV !== 'production') {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      title: '家計簿API',
      version: '1.0.0',
    },
  });

  // Swagger UI
  app.get('/ui', swaggerUI({ url: '/api/doc' }));
}

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
