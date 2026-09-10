import pino from 'pino';

type LogValue = string | number | boolean | null | undefined | LogRecord | LogValue[];

type LogRecord = {
  [key: string]: LogValue;
};

const isProduction = process.env.NODE_ENV === 'production';
const level = isProduction ? 'info' : 'trace';

const baseLogger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true },
      },
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings() {
      return {};
    },
  },
});

export const log = {
  debug(event: string, data?: LogRecord) {
    baseLogger.debug(data || {}, event);
  },
  info(event: string, data?: LogRecord) {
    baseLogger.info(data || {}, event);
  },
  warn(event: string, data?: LogRecord) {
    baseLogger.warn(data || {}, event);
  },
  error(event: string, data?: LogRecord) {
    baseLogger.error(data || {}, event);
  },
};
