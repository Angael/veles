import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

export type ScrubOptions = {
  value: number | null;
  /** Value to start from when the field is empty, e.g. last time's weight. */
  fallback: number;
  /** Fine step used while dragging slowly, e.g. 0.5 kg or 1 rep. */
  step: number;
  /** Values snap to this while dragging fast, e.g. 2.5 kg. Defaults to `step`. */
  coarseStep?: number;
  min?: number;
  max?: number;
  /** Pixels of slow drag per fine step. */
  pixelsPerStep?: number;
  onChange: (value: number) => void;
  /** Tap without dragging. */
  onTap?: () => void;
};

/** Pointer speed (px/ms) above which a drag snaps to `coarseStep`. */
const FAST = 0.6;
/** Horizontal travel before a press turns into a scrub; below it, it's a tap or a scroll. */
const ACTIVATE_PX = 6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundTo = (value: number, step: number) =>
  Number((Math.round(value / step) * step).toFixed(3));

/**
 * Drag-sideways number editing with pointer acceleration, like a mouse cursor: slow drags move
 * one fine step at a time, fast flicks cover big ranges and snap to the coarse step. Vertical
 * movement is left to the browser so the page still scrolls (pair with `touch-action: pan-y`).
 */
export function useScrub({
  coarseStep,
  fallback,
  max = 9999,
  min = 0,
  onChange,
  onTap,
  pixelsPerStep = 14,
  step,
  value,
}: ScrubOptions) {
  const drag = useRef<{
    id: number;
    startX: number;
    lastX: number;
    lastT: number;
    start: number;
    travel: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const [scrub, setScrub] = useState<{ offset: number; fast: boolean; velocity: number } | null>(
    null,
  );
  const current = value ?? fallback;

  function emit(next: number) {
    const clamped = clamp(next, min, max);
    if (clamped === current) return;
    onChange(clamped);
    if ('vibrate' in navigator) navigator.vibrate(3);
  }

  const handlers = {
    onKeyDown(event: KeyboardEvent) {
      const big = event.shiftKey ? (coarseStep ?? step * 5) : step;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') emit(roundTo(current + big, step));
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
        emit(roundTo(current - big, step));
      else if (event.key === 'Enter' || event.key === ' ') onTap?.();
      else return;
      event.preventDefault();
    },
    onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      drag.current = {
        active: false,
        id: event.pointerId,
        lastT: event.timeStamp,
        lastX: event.clientX,
        start: current,
        startX: event.clientX,
        travel: 0,
        velocity: 0,
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const state = drag.current;
      if (!state || state.id !== event.pointerId) return;
      if (!state.active) {
        if (Math.abs(event.clientX - state.startX) < ACTIVATE_PX) return;
        state.active = true;
        state.lastX = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const dx = event.clientX - state.lastX;
      const dt = Math.max(1, event.timeStamp - state.lastT);
      // Smoothed speed so one jittery event doesn't flip precision.
      state.velocity = state.velocity * 0.6 + (Math.abs(dx) / dt) * 0.4;
      state.lastX = event.clientX;
      state.lastT = event.timeStamp;
      // Acceleration curve: under ~0.15 px/ms you get less than 1× (extra precise).
      const gain = clamp((state.velocity / 0.25) ** 1.4, 0.35, 8);
      state.travel += dx * gain;

      const fast = state.velocity > FAST && coarseStep !== undefined;
      const raw = state.start + (state.travel / pixelsPerStep) * step;
      emit(roundTo(raw, fast ? coarseStep : step));
      setScrub({ fast, offset: state.travel, velocity: state.velocity });
    },
    onPointerUp(event: PointerEvent) {
      const state = drag.current;
      drag.current = null;
      setScrub(null);
      if (state && !state.active && event.type === 'pointerup') onTap?.();
    },
  };

  return {
    handlers: {
      ...handlers,
      onPointerCancel: (event: PointerEvent) => handlers.onPointerUp(event),
    },
    /** Current drag, for ruler offset and a "±2.5" precision badge; null when idle. */
    scrub,
    precision: scrub?.fast && coarseStep !== undefined ? coarseStep : step,
  };
}
