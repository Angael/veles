import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { weekSwipeDirection } from './weekSwipe';

type SwipeStart = { pointerId: number; x: number; y: number };

type UseWeekSwipeOptions = {
  onSwipe: (direction: -1 | 1) => void;
};

/** Recognizes intentional horizontal touch swipes without taking over vertical page scrolling. */
export function useWeekSwipe({ onSwipe }: UseWeekSwipeOptions) {
  const start = useRef<SwipeStart | null>(null);
  const suppressClick = useRef(false);

  function resetSwipe() {
    start.current = null;
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;

    suppressClick.current = false;
    start.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const swipeStart = start.current;
    resetSwipe();

    if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;

    const direction = weekSwipeDirection(swipeStart, { x: event.clientX, y: event.clientY });
    if (direction === null) return;

    suppressClick.current = true;
    onSwipe(direction);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }

  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!suppressClick.current) return;

    event.preventDefault();
    event.stopPropagation();
  }

  return { onClickCapture, onPointerCancel: resetSwipe, onPointerDown, onPointerUp };
}
