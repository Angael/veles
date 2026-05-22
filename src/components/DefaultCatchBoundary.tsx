import type { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Something failed</h1>
      <p>{error.message || 'Unexpected error'}</p>
    </main>
  );
}
