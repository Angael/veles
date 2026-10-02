import { useLayoutEffect, useRef } from 'react';

type CountUpProps = {
  className?: string;
  decimals?: number;
  durationMs?: number;
  /** Starting point for the first roll; later changes roll from the previously shown value. */
  from?: number;
  value: number;
};

/**
 * Adapted from React Bits "Count Up" (https://reactbits.dev/text-animations/count-up) without the
 * motion dependency. The server renders the final number; on the client the existing text node is
 * eased from the previous value, so logging food visibly rolls the totals forward.
 */
export function CountUp({
  className,
  decimals = 0,
  durationMs = 1400,
  from = 0,
  value,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(from);

  // Layout effect so the starting value replaces the final one before the browser paints.
  useLayoutEffect(() => {
    const node = ref.current?.firstChild;
    const start = shown.current;
    if (!node || start === value) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = value;
      return;
    }

    node.nodeValue = start.toFixed(decimals);
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 4;
      shown.current = start + (value - start) * eased;
      node.nodeValue = shown.current.toFixed(decimals);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [decimals, durationMs, value]);

  return (
    <span className={className} ref={ref}>
      {value.toFixed(decimals)}
    </span>
  );
}
