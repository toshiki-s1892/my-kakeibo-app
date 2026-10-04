import { structuredLogger } from '@hono/structured-logger';
import { HTTP_STATUS } from '@repo/common';
import { createLogger, type Logger, type LogLevel } from '@/server/lib/logger';

const levelFromStatus = (status: number): LogLevel => {
  if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return 'error';
  } else if (status >= HTTP_STATUS.BAD_REQUEST) {
    return 'warn';
  } else {
    return 'info';
  }
};

const logRequestCompleted = (logger: Logger, status: number, elapsedMs: number) => {
  const logLevel = levelFromStatus(status);
  logger[logLevel](
    {
      status,
      elapsedMs,
    },
    'リクエスト完了'
  );
};

export const requestLogger = structuredLogger({
  createLogger: (c) =>
    createLogger({
      requestId: c.var.requestId,
      method: c.req.method,
      path: c.req.path,
    }),
  onResponse: (logger, c, elapsedMs) => {
    logRequestCompleted(logger, c.res.status, elapsedMs);
  },
  onError: (logger, _err, c, elapsedMs) => {
    logRequestCompleted(logger, c.res.status, elapsedMs);
  },
});
