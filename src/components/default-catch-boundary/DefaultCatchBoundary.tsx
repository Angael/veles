import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { Btn } from '@/components/btn/Btn';

export function DefaultCatchBoundary(_props: ErrorComponentProps) {
  const router = useRouter();

  return (
    <main style={{ padding: 'var(--space-xl)', fontFamily: 'var(--font-sans)' }}>
      <h1>Something failed</h1>
      <p>We could not load this page. Please try again.</p>
      <Btn onClick={() => void router.invalidate()} type='button'>
        Try again
      </Btn>
    </main>
  );
}
