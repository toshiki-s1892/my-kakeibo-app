import { requestLogger } from '@/server/middleware/request-logger';
import { errorHandler } from '@/server/shared/error-handler';
import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';

export const createTestApp = () => {
  const app = new OpenAPIHono();
  app.use(requestId());
  app.use(requestLogger);
  app.onError(errorHandler);
  return app;
};
