import profileRouter from '@/server/routes/profile';
import { errorHandler } from '@/server/shared/error-handler';
import { clerkMiddleware } from '@clerk/hono';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { handle } from 'hono/vercel';
export const runtime = 'edge';

const app = new OpenAPIHono().basePath('/api');

app.use('/profile/*', clerkMiddleware());
app.route('/profile', profileRouter);

app.onError(errorHandler);

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: '家計簿API',
    version: '1.0.0',
  },
});

// Swagger UI
app.get('/ui', swaggerUI({ url: '/api/doc' }));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
