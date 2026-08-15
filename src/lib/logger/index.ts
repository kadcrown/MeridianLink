type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level?: LogLevel;
  context?: string;
  requestId?: string;
  data?: Record<string, unknown>;
  error?: Error | unknown;
}

const REDACTED_KEYS = ['password', 'secret', 'token', 'authorization', 'cookie', 'key', 'apiKey', 'accessKey'];

function redactSensitiveData(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const logger = {
  log(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      context: payload.context || 'App',
      message: payload.message,
      requestId: payload.requestId,
      data: payload.data ? redactSensitiveData(payload.data) : undefined,
      error: payload.error instanceof Error ? {
        name: payload.error.name,
        message: payload.error.message,
        stack: process.env.NODE_ENV !== 'production' ? payload.error.stack : undefined,
      } : payload.error,
    };

    const formatted = JSON.stringify(entry);

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else if (level === 'debug') {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatted);
      }
    } else {
      console.log(formatted);
    }
  },

  info(message: string, data?: Record<string, unknown>, context?: string) {
    this.log('info', { message, data, context });
  },

  warn(message: string, data?: Record<string, unknown>, context?: string) {
    this.log('warn', { message, data, context });
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>, context?: string) {
    this.log('error', { message, error, data, context });
  },

  debug(message: string, data?: Record<string, unknown>, context?: string) {
    this.log('debug', { message, data, context });
  },
};
