import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main style={{ padding: 'var(--space-xl)', font: 'var(--type-body)', color: 'var(--c-text)' }}>
      <h1 style={{ font: 'var(--type-display)', textWrap: 'balance' }}>Page not found</h1>
      <Link to='/'>Back home</Link>
    </main>
  );
}
