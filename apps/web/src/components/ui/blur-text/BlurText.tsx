import clsx from 'clsx';
import css from './BlurText.module.css';

type BlurTextProps = {
  className?: string;
  delayMs?: number;
  /** Words read calmer; letters suit short labels. */
  splitBy?: 'letters' | 'words';
  stepMs?: number;
  text: string;
};

/**
 * Adapted from React Bits "Blur Text" (https://reactbits.dev/text-animations/blur-text) as a CSS
 * animation: each word or letter rises out of a blur with a stagger. Screen readers get the plain
 * text once; the animated pieces are hidden from them. Remount with a `key` to replay.
 */
export function BlurText({
  className,
  delayMs = 0,
  splitBy = 'words',
  stepMs = 70,
  text,
}: BlurTextProps) {
  const parts = splitBy === 'words' ? text.split(' ') : Array.from(text);

  return (
    <span className={clsx(css.root, className)}>
      <span className={css.label}>{text}</span>
      <span aria-hidden='true'>
        {parts.map((part, index) => (
          <span
            className={css.part}
            // oxlint-disable-next-line react/no-array-index-key -- Pieces are positional and never reorder.
            key={index}
            style={{ animationDelay: `${delayMs + index * stepMs}ms` }}
          >
            {part === ' ' ? ' ' : part}
            {splitBy === 'words' && index < parts.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  );
}
