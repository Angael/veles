import { Slider, type SliderRootProps } from '@base-ui/react/slider';
import clsx from 'clsx';
import { RotateCcwIcon } from 'lucide-react';
import { Btn } from '../btn/Btn';
import css from './SliderInput.module.css';

type SliderInputProps = Omit<
  SliderRootProps,
  'children' | 'className' | 'defaultValue' | 'onValueChange' | 'value'
> & {
  className?: string;
  defaultValue?: number;
  label: string;
  onValueChange?: (value: number) => void;
  /** Icon button beside the track that sets `value`; disabled while the slider already holds it. */
  reset?: { label: string; value: number };
  value?: number;
};

export function SliderInput({
  className,
  label,
  onValueChange,
  reset,
  ...props
}: SliderInputProps) {
  return (
    <Slider.Root
      className={clsx(css.root, className)}
      onValueChange={(value) => {
        if (typeof value === 'number') {
          onValueChange?.(value);
        }
      }}
      {...props}
    >
      <div className={css.header}>
        <Slider.Label>{label}</Slider.Label>
        <Slider.Value>{(formattedValues) => formattedValues[0] ?? ''}</Slider.Value>
      </div>

      <div className={css.row}>
        <Slider.Control className={css.control}>
          <Slider.Track className={css.track}>
            <Slider.Indicator className={css.indicator} />
            <Slider.Thumb aria-label={label} className={css.thumb} />
          </Slider.Track>
        </Slider.Control>
        {reset ? (
          <Btn
            aria-label={reset.label}
            disabled={props.value === reset.value}
            icon={<RotateCcwIcon aria-hidden='true' />}
            iconOnly
            onClick={() => onValueChange?.(reset.value)}
            size='sm'
            title={reset.label}
            type='button'
            variant='ghost'
          />
        ) : null}
      </div>
    </Slider.Root>
  );
}
