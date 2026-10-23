import { Autocomplete } from '@base-ui/react/autocomplete';
import type { ReactNode } from 'react';
import { type InputSize, TextInput } from '@/components/ui/text-input/TextInput';
import css from './AutocompleteInput.module.css';

type AutocompleteInputProps<Item> = {
  'aria-label'?: string;
  /** Shown in the popup when nothing matches; not announced as a selectable option. */
  empty?: ReactNode;
  itemKey: (item: Item) => string;
  /** Suggestions already filtered and ranked by the caller. */
  items: Item[];
  itemToString: (item: Item) => string;
  onSelect: (item: Item) => void;
  /** Free text typed by the user; picking a suggestion calls `onSelect` instead. */
  onValueChange: (value: string) => void;
  placeholder?: string;
  renderItem: (item: Item) => ReactNode;
  size?: InputSize;
  value: string;
};

/**
 * Free-text input with suggestions. Base UI owns the combobox semantics: arrow keys move the
 * active option, Enter picks it, Escape closes the popup. The text may stay a custom value.
 */
export function AutocompleteInput<Item>({
  empty,
  itemKey,
  items,
  itemToString,
  onSelect,
  onValueChange,
  placeholder,
  renderItem,
  size = 'md',
  value,
  ...props
}: AutocompleteInputProps<Item>) {
  return (
    <Autocomplete.Root
      filter={null}
      itemToStringValue={itemToString}
      items={items}
      onValueChange={(next, details) => {
        if (details.reason !== 'item-press') onValueChange(next);
      }}
      value={value}
    >
      <Autocomplete.Input
        aria-label={props['aria-label']}
        placeholder={placeholder}
        render={<TextInput size={size} />}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={css.positioner} sideOffset={6}>
          <Autocomplete.Popup className={css.popup}>
            {empty ? <Autocomplete.Empty className={css.empty}>{empty}</Autocomplete.Empty> : null}
            <Autocomplete.List className={css.list}>
              {(item: Item) => (
                <Autocomplete.Item
                  className={css.item}
                  key={itemKey(item)}
                  onClick={() => onSelect(item)}
                  value={item}
                >
                  {renderItem(item)}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
