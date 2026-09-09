import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main style={{ padding: 'var(--space-xl)', fontFamily: 'var(--font-sans)' }}>
      <h1>Page not found</h1>
      <Link to='/'>Back home</Link>
    </main>
  );
}
