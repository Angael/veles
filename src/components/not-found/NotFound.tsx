import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main style={{ padding: 'var(--space-5xl)', fontFamily: 'var(--font-sans)' }}>
      <h1>Page not found</h1>
      <Link to='/'>Back home</Link>
    </main>
  );
}
