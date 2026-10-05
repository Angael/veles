import clsx from 'clsx';
import { CornerDownLeftIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypeSetsDemo } from '../hints/GestureDemos';
import { SET_TYPE_LABELS } from '../mockData';
import { describeSet, parseSetShorthand, type ParsedSet } from '../setShorthand';
import css from './Inputs.module.css';

type ShorthandInputProps = {
  /** Smaller variant placed inside an exercise card. */
  compact?: boolean;
  defaultValue?: string;
  onSubmit: (sets: ParsedSet[]) => void;
};

/**
 * One text field instead of a form: type `60x8, 70x6, 80x4x2` and see the sets appear as chips
 * before committing. Inspired by Liftosaur's Liftoscript and the way people text their sets.
 */
export function ShorthandInput({
  compact = false,
  defaultValue = '',
  onSubmit,
}: ShorthandInputProps) {
  const [text, setText] = useState(defaultValue);
  const { errors, sets } = parseSetShorthand(text);
  const canSubmit = sets.length > 0 && errors.length === 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit(sets);
    setText('');
  }

  return (
    <div className={clsx(css.shorthand, compact && css.compact)}>
      <TextInput
        aria-label='Sets, for example 80x5x3'
        autoCapitalize='off'
        autoComplete='off'
        autoFocus={compact}
        enterKeyHint='done'
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
        }}
        placeholder='80x5x3, w40x10, 45s…'
        size={compact ? 'sm' : 'md'}
        spellCheck={false}
        trailing={
          <Btn
            aria-label='Add sets'
            disabled={!canSubmit}
            icon={<CornerDownLeftIcon aria-hidden='true' />}
            iconOnly
            onClick={submit}
            size='sm'
            variant='ghost'
          />
        }
        value={text}
      />
      {compact && !text ? (
        <div className={css.inlineDemo}>
          <TypeSetsDemo />
          <span>
            Type sets like <code>80x5x3</code> (3 sets), <code>w40x10</code> (warm-up) or{' '}
            <code>45s</code>.
          </span>
        </div>
      ) : null}
      {sets.length > 0 || errors.length > 0 ? (
        <ul aria-live='polite' className={css.chips}>
          {sets.map((set, index) => (
            <li
              className={clsx(css.chip, set.type !== 'normal' && css[`chip_${set.type}`])}
              key={index}
              title={SET_TYPE_LABELS[set.type]}
            >
              {set.type === 'normal' ? null : <b>{set.type[0]?.toUpperCase()}</b>}
              {describeSet(set)}
              {set.rpe === null ? null : <small>@{set.rpe}</small>}
            </li>
          ))}
          {errors.map((error) => (
            <li className={clsx(css.chip, css.chipError)} key={error}>
              {error}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
