import { configure } from 'safe-stable-stringify';

const stringify = configure({
  deterministic: false,
});

export type Logger = {
  error: (fields: Record<string, unknown>, message: string) => void;
  warn: (fields: Record<string, unknown>, message: string) => void;
  info: (fields: Record<string, unknown>, message: string) => void;
};
export type LogLevel = keyof Logger;

type CreateLoggerProps = {
  requestId: string;
  method: string;
  path: string;
};

export const createLogger = (createLoggerProps: CreateLoggerProps): Logger => {
  const write = (level: LogLevel, fields: Record<string, unknown>, message: string) => {
    const timestamp = new Date().toISOString();
    let payload: string;
    try {
      const entry = { ...fields, ...createLoggerProps, timestamp, level, message };
      payload = stringify(entry);
    } catch {
      const entry = { ...createLoggerProps, timestamp, level, message, serializeFailed: true };
      payload = stringify(entry);
    }

    output[level](payload);
  };

  return {
    error: (fields, message) => {
      write('error', fields, message);
    },
    warn: (fields, message) => {
      write('warn', fields, message);
    },
    info: (fields, message) => {
      write('info', fields, message);
    },
  };
};

const output: Record<LogLevel, (payload: string) => void> = {
  error: (payload) => console.error(payload),
  warn: (payload) => console.warn(payload),
  info: (payload) => console.info(payload),
};
