import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Card } from '@/components/Card';
import css from './demo.module.css';

const explainServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const requestId = crypto.randomUUID();

  console.info('demo.server_function_called', {
    requestId,
    route: '/demo/start/server-funcs',
  });

  return {
    requestId,
    runtime: 'server',
    timestamp: new Date().toISOString(),
  };
});

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: ServerFunctionsPage,
});

function ServerFunctionsPage() {
  const [result, setResult] = useState<string>('Waiting for a server call.');

  return (
    <Card as='article'>
      <div className={css.body}>
        <span className={css.badge}>createServerFn</span>
        <h1>Server function route</h1>
        <p>Click the button to call a server-only function and emit a server log entry.</p>
        <button
          className={css.primaryButton}
          onClick={async () => {
            const data = await explainServerFn();
            setResult(`${data.runtime} at ${data.timestamp} (${data.requestId})`);
          }}
          type='button'
        >
          Call server function
        </button>
        <div className={css.result}>{result}</div>
      </div>
    </Card>
  );
}
