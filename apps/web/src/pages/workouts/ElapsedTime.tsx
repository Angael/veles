import { useEffect, useState } from 'react';

const pad = (value: number) => String(value).padStart(2, '0');

/** `m:ss` under an hour, `h:mm:ss` after. */
export const formatElapsed = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}`
    : `${minutes}:${pad(seconds % 60)}`;
};

/** Live clock for an open workout, counting up from `startedAt` once a second. */
export function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time dateTime={`PT${Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000))}S`}>
      {formatElapsed((now - Date.parse(startedAt)) / 1000)}
    </time>
  );
}
