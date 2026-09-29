import { useEffect, useRef } from 'react';
import { RouteBackButton } from './RouteBackButton';
import css from './TaskHeader.module.css';

/**
 * Sticky back + title bar for task routes. An IntersectionObserver flips `data-collapsed` once the
 * page scrolls past the sentinel; CSS then scales the title and fades in the bar. No scroll
 * listeners, no React re-renders, no layout work while scrolling.
 */
export function TaskHeader({ label }: { label?: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const header = headerRef.current;
    if (!sentinel || !header) return;

    const observer = new IntersectionObserver(([entry]) => {
      header.toggleAttribute('data-collapsed', entry ? !entry.isIntersecting : false);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden='true' className={css.sentinel} ref={sentinelRef} />
      <header className={css.header} ref={headerRef}>
        <RouteBackButton variant='ghost' />
        {label ? <h1 className={css.title}>{label}</h1> : null}
      </header>
    </>
  );
}
