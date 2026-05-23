type LogLevel = 'info' | 'warn' | 'error';

type LogValue = string | number | boolean | null | undefined | LogRecord | LogValue[];

type LogRecord = {
  [key: string]: LogValue;
};

function write(level: LogLevel, event: string, data?: LogRecord) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.info(entry);
}

export const logger = {
  info(event: string, data?: LogRecord) {
    write('info', event, data);
  },
  warn(event: string, data?: LogRecord) {
    write('warn', event, data);
  },
  error(event: string, data?: LogRecord) {
    write('error', event, data);
  },
};
