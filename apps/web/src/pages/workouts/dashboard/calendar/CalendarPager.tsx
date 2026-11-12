import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import css from './Calendar.module.css';

type CalendarPagerProps = {
  count: number;
  index: number;
  label: string;
  onIndexChange: (index: number) => void;
  /** Pages rendered on each side of the current one; their data is ready before a swipe. */
  overscan: number;
  renderPage: (page: number) => ReactNode;
};

/**
 * Swipeable pages for touch; mouse users page with the header arrows, so dragging never fights
 * with clicking a workout. All pages exist as empty slides and only those near the current one
 * have content, which keeps years of history cheap. The inline start offset puts the server
 * rendered page in place before Embla takes over.
 */
export function CalendarPager({
  count,
  index,
  label,
  onIndexChange,
  overscan,
  renderPage,
}: CalendarPagerProps) {
  const [startIndex] = useState(index);
  const [viewportRef, api] = useEmblaCarousel({
    duration: 24,
    startIndex,
    watchDrag: (_api, event) => event.type === 'touchstart',
  });
  // The last page this pager knows about, so its own swipes are not replayed back into it.
  const known = useRef(index);
  const report = useRef(onIndexChange);
  useEffect(() => {
    report.current = onIndexChange;
  });

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const selected = api.selectedScrollSnap();
      if (selected === known.current) return;
      known.current = selected;
      report.current(selected);
    };
    // Embla remeasures on resize and rotation and would otherwise return to its first page.
    const onReInit = () => api.scrollTo(known.current, true);
    api.on('select', onSelect);
    api.on('reInit', onReInit);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onReInit);
    };
  }, [api]);

  useEffect(() => {
    if (!api || index === known.current) return;
    known.current = index;
    api.scrollTo(index);
  }, [api, index]);

  return (
    <div
      aria-label={label}
      aria-roledescription='carousel'
      className={css.viewport}
      ref={viewportRef}
      role='group'
    >
      <div className={css.track} style={{ transform: `translate3d(${-startIndex * 100}%, 0, 0)` }}>
        {Array.from({ length: count }, (_, page) => (
          <div aria-hidden={page !== index} className={css.page} inert={page !== index} key={page}>
            {Math.abs(page - index) <= overscan ? renderPage(page) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
