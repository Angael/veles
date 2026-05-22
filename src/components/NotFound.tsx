import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Page not found</h1>
      <Link to='/'>Back home</Link>
    </main>
  )
}
