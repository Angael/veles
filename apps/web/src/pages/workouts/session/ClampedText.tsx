import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import css from './ExerciseHistory.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

type ClampedTextProps = {
  text: string;
  className?: string;
  /** Line clamp applied while collapsed. */
  clampClassName?: string;
  /** What the text is, so screen readers hear "Show more: Note" rather than a bare "Show more". */
  label: Localized;
};

/**
 * Text cut to a few lines with a Show more/less toggle. The toggle only appears when the clamp
 * actually hides something at the current width, so short text never gets a pointless button and
 * long text is never cut off without a way to read the rest.
 */
export function ClampedText({ className, clampClassName, label, text }: ClampedTextProps) {
  const { t } = useI18n();
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || expanded) return;
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);

  const toggle = expanded
    ? t({ en: 'Show less', pl: 'Pokaż mniej' })
    : t({ en: 'Show more', pl: 'Pokaż więcej' });

  return (
    <div className={css.clampedText}>
      <p className={clsx(className, !expanded && clampClassName)} id={id} ref={ref}>
        {text}
      </p>
      {expanded || overflowing ? (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          aria-label={`${toggle}: ${t(label)}`}
          className={css.toggle}
          onClick={() => setExpanded(!expanded)}
          type='button'
        >
          {toggle}
        </button>
      ) : null}
    </div>
  );
}
