export const WEEK_SWIPE_THRESHOLD = 64;

type SwipePosition = { x: number; y: number };

/** Returns the week direction only for an intentional, predominantly horizontal swipe. */
export function weekSwipeDirection(start: SwipePosition, end: SwipePosition) {
  const horizontalDistance = end.x - start.x;
  const verticalDistance = end.y - start.y;

  if (
    Math.abs(horizontalDistance) < WEEK_SWIPE_THRESHOLD ||
    Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
  ) {
    return null;
  }

  return horizontalDistance < 0 ? 1 : -1;
}
