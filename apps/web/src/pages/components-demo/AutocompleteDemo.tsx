import { useState } from 'react';
import { AutocompleteInput } from '@/components/ui/autocomplete-input/AutocompleteInput';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango', 'Orange'];

/** Free-text input with filtered suggestions; picking one replaces the text. */
export function AutocompleteDemo() {
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const query = value.trim().toLocaleLowerCase();
  const items = FRUITS.filter((fruit) => fruit.toLocaleLowerCase().includes(query));

  return (
    <section>
      <h2>AutocompleteInput</h2>
      <AutocompleteInput
        aria-label='Demo autocomplete input'
        empty='No fruit matches; the text stays custom.'
        itemKey={(fruit) => fruit}
        items={items}
        itemToString={(fruit) => fruit}
        onSelect={(fruit) => {
          setValue(fruit);
          setPicked(fruit);
        }}
        onValueChange={(next) => {
          setValue(next);
          setPicked(null);
        }}
        placeholder='Type a fruit'
        renderItem={(fruit) => fruit}
        value={value}
      />
      <p>{picked ? `Picked: ${picked}` : `Custom text: ${value || '–'}`}</p>
    </section>
  );
}
