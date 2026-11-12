import { Combobox } from '@base-ui/react/combobox';
import { Link } from '@tanstack/react-router';
import { BarcodeIcon, SearchIcon } from 'lucide-react';
import type { RefObject } from 'react';
import { FoodSearchOption } from './FoodSearchOption';
import {
  foodSearchResultKey,
  foodSearchResultLabel,
  type FoodSearchResult,
} from './foodSearchResults';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  date: string;
  disabled?: boolean;
  /** Renders the results under the input instead of in a floating popup (phone takeover). */
  inline?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  fetching: boolean;
  query: string;
  results: FoodSearchResult[];
  onPick: (result: FoodSearchResult) => void;
  onQueryChange: (query: string) => void;
};

/** The search field and its result list, as a floating dropdown or inline in the phone takeover. */
export function FoodSearchCombobox({
  date,
  disabled = false,
  fetching,
  inline = false,
  inputRef,
  loading,
  onPick,
  onQueryChange,
  query,
  results,
}: Props) {
  const { locale, t } = useI18n();

  const content = (
    <>
      <Combobox.Status className={css.message}>
        {loading ? t({ en: 'Loading foods…', pl: 'Ładowanie jedzenia…' }) : null}
      </Combobox.Status>
      <Combobox.Empty className={css.message}>
        {loading
          ? null
          : t({
              en: 'No foods yet. Type a name to create one.',
              pl: 'Brak produktów. Wpisz nazwę, aby utworzyć nowy.',
            })}
      </Combobox.Empty>
      <Combobox.List className={css.list} render={<List />}>
        {(result: FoodSearchResult) => (
          <FoodSearchOption key={foodSearchResultKey(result)} result={result} />
        )}
      </Combobox.List>
    </>
  );

  return (
    <Combobox.Root<FoodSearchResult>
      autoHighlight
      disabled={disabled}
      filter={null}
      inline={inline}
      inputValue={query}
      itemToStringLabel={(result) => foodSearchResultLabel(result, locale)}
      items={results}
      onInputValueChange={onQueryChange}
      onValueChange={(result) => {
        if (result) onPick(result);
      }}
      open={inline ? true : undefined}
      value={null}
    >
      <div className={css.search}>
        <SearchIcon aria-hidden='true' className={css.searchIcon} />
        <Combobox.Input
          aria-label={t({ en: 'Search foods to log', pl: 'Szukaj jedzenia do dodania' })}
          className={css.input}
          placeholder={t({
            en: 'Add food: banana, bread, yoghurt…',
            pl: 'Dodaj jedzenie: banan, chleb, jogurt…',
          })}
          ref={inputRef}
          render={<TextInput trailing={<ScanButton date={date} disabled={disabled} />} />}
        />
      </div>

      {inline ? (
        <div aria-busy={fetching} className={css.inlineResults}>
          {content}
        </div>
      ) : (
        <Combobox.Portal>
          <Combobox.Positioner className={css.positioner} sideOffset={4}>
            <Combobox.Popup aria-busy={fetching} className={css.popup}>
              {content}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  );
}

export function ScanButton({ date, disabled = false }: { date: string; disabled?: boolean }) {
  const { t } = useI18n();
  const label = t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' });
  // A disabled link would still navigate, so this renders a real disabled button instead.
  if (disabled) {
    return (
      <Btn
        aria-label={label}
        disabled
        icon={<BarcodeIcon aria-hidden='true' />}
        iconOnly
        size='sm'
        variant='ghost'
      />
    );
  }
  return (
    <Btn
      aria-label={label}
      icon={<BarcodeIcon aria-hidden='true' />}
      iconOnly
      isLink
      render={<Link search={{ date }} to='/calories/scan' />}
      size='sm'
      variant='ghost'
    />
  );
}
