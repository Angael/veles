import { Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { ChevronDownIcon } from 'lucide-react';
import css from './SelectInput.module.css';

type SelectInputItem<Value extends string> = {
  label: string;
  value: Value;
};

type SelectInputProps<Value extends string> = Omit<
  Select.Root.Props<Value>,
  'children' | 'items'
> & {
  className?: string;
  items: readonly SelectInputItem<Value>[];
  placeholder?: string;
};

export function SelectInput<Value extends string>({
  className,
  items,
  placeholder,
  ...props
}: SelectInputProps<Value>) {
  return (
    <Select.Root items={items} {...props}>
      <Select.Trigger className={clsx(css.trigger, className)}>
        <Select.Value className={css.value} placeholder={placeholder} />

        <Select.Icon className={css.icon}>
          <ChevronDownIcon aria-hidden='true' size={16} strokeWidth={1.8} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false} className={css.positioner} sideOffset={6}>
          <Select.Popup className={css.popup}>
            <Select.List className={css.list}>
              {items.map((item) => (
                <Select.Item className={css.item} key={item.value} value={item.value}>
                  <Select.ItemText className={css.itemText}>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
