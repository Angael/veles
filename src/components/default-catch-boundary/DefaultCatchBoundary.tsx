import type { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <main style={{ padding: 'var(--space-xl)', fontFamily: 'var(--font-sans)' }}>
      <h1>Something failed</h1>
      <p>{error.message || 'Unexpected error'}</p>
    </main>
  );
}
