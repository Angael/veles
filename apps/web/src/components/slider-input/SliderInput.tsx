import { Slider, type SliderRootProps } from '@base-ui/react/slider';
import clsx from 'clsx';
import css from './SliderInput.module.css';

type SliderInputProps = Omit<
  SliderRootProps,
  'children' | 'className' | 'defaultValue' | 'onValueChange' | 'value'
> & {
  className?: string;
  defaultValue?: number;
  label: string;
  onValueChange?: (value: number) => void;
  value?: number;
};

export function SliderInput({ className, label, onValueChange, ...props }: SliderInputProps) {
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

      <Slider.Control className={css.control}>
        <Slider.Track className={css.track}>
          <Slider.Indicator className={css.indicator} />
          <Slider.Thumb aria-label={label} className={css.thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
