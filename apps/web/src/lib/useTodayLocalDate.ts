import { differenceInMilliseconds, startOfTomorrow } from 'date-fns';
import { useSyncExternalStore } from 'react';
import { subscribeAppResume } from './appResume';
import { todayLocalDate } from './dateOnly';

/**
 * Today's local `YYYY-MM-DD` date that stays current.
 *
 * Re-renders at midnight and when the app resumes, so a page left open overnight (or a frozen
 * PWA reopened the next morning) moves to the new day.
 */
export function useTodayLocalDate() {
  return useSyncExternalStore(subscribeToday, todayLocalDate, todayLocalDate);
}

function subscribeToday(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function scheduleMidnight() {
    clearTimeout(timer);
    // A small margin keeps the timer from firing a moment before the date flips.
    const delay = differenceInMilliseconds(startOfTomorrow(), new Date()) + 1000;
    timer = setTimeout(() => {
      onChange();
      scheduleMidnight();
    }, delay);
  }

  scheduleMidnight();
  const unsubscribeResume = subscribeAppResume(() => {
    onChange();
    scheduleMidnight();
  });
  return () => {
    clearTimeout(timer);
    unsubscribeResume();
  };
}
