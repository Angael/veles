import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/** Step used from a given drag speed (px/ms) upward; the first tier must start at 0. */
export type ScrubTier = { from: number; step: number };

export type ScrubOptions = {
  value: number | null;
  /** Value to start from when the field is empty, e.g. last time's weight. */
  fallback: number;
  /** Slow drag uses the first step; faster drags move to bigger steps and snap to them. */
  tiers: ScrubTier[];
  max?: number;
  /** Pixels of drag per step, at every speed. */
  pixelsPerStep?: number;
  onChange: (value: number) => void;
  /** Tap without dragging. */
  onTap?: () => void;
};

/** Horizontal travel before a press turns into a scrub; below it, it's a tap or a scroll. */
const ACTIVATE_PX = 6;

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));
const roundTo = (value: number, step: number) =>
  Number((Math.round(value / step) * step).toFixed(3));
const stepAt = (tiers: ScrubTier[], velocity: number) =>
  tiers.findLast((tier) => velocity >= tier.from)?.step ?? tiers[0]?.step ?? 1;

/**
 * Drag-sideways number editing where speed picks the step: slow drags move by the smallest
 * step, faster ones jump to bigger steps and snap to them, so no step setting is needed.
 * Touch follows the finger like a ruler (finger right = smaller), mouse drags right = bigger.
 * Never goes below zero. Vertical movement still scrolls (pair with `touch-action: pan-y`).
 */
export function useScrub({
  fallback,
  max = 9999,
  onChange,
  onTap,
  pixelsPerStep = 12,
  tiers,
  value,
}: ScrubOptions) {
  const drag = useRef<{
    id: number;
    direction: 1 | -1;
    startX: number;
    lastX: number;
    lastT: number;
    raw: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const [offset, setOffset] = useState<number | null>(null);
  const current = value ?? fallback;
  const smallest = tiers[0]?.step ?? 1;
  const largest = tiers.at(-1)?.step ?? smallest;

  function emit(next: number) {
    const clamped = clamp(next, max);
    if (clamped === current) return;
    onChange(clamped);
    if ('vibrate' in navigator) navigator.vibrate(3);
  }

  function end(event: PointerEvent) {
    const state = drag.current;
    drag.current = null;
    setOffset(null);
    if (state && !state.active && event.type === 'pointerup') onTap?.();
  }

  return {
    /** Finger travel in px while scrubbing, for the ruler; null when idle. */
    offset,
    handlers: {
      onKeyDown(event: KeyboardEvent) {
        const step = event.shiftKey ? largest : smallest;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') emit(current + step);
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') emit(current - step);
        else if (event.key === 'Enter' || event.key === ' ') onTap?.();
        else return;
        event.preventDefault();
      },
      onPointerDown(event: PointerEvent) {
        if (event.button !== 0) return;
        drag.current = {
          active: false,
          direction: event.pointerType === 'touch' ? -1 : 1,
          id: event.pointerId,
          lastT: event.timeStamp,
          lastX: event.clientX,
          raw: current,
          startX: event.clientX,
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
        // Smoothed speed so one jittery event doesn't flip the step.
        state.velocity = state.velocity * 0.6 + (Math.abs(dx) / dt) * 0.4;
        state.lastX = event.clientX;
        state.lastT = event.timeStamp;

        const step = stepAt(tiers, state.velocity);
        state.raw = clamp(state.raw + (dx / pixelsPerStep) * step * state.direction, max);
        emit(roundTo(state.raw, step));
        setOffset(event.clientX - state.startX);
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
