import { useNavigate, useRouter } from '@tanstack/react-router';
import { ClipboardIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './WeightEntryPages.module.css';
import { parseWeightEntries } from './parseWeightEntries';
import { MAX_WEIGHT_IMPORT_ENTRIES } from './weight.validation';
import { useSaveWeightsMutation } from './weight.query';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';
import { type Localized, pluralEn, pluralPl } from '@/lib/i18n/locale';

const aiPrompt: Localized = {
  en: `Convert my weight history to plain text with exactly one entry per line in this format:
YYYY-MM-DD <weight>kg

Use ISO dates, kilograms, and no headings, bullets, notes, or code fences. Convert other weight units to kilograms. Example:
2026-08-01 78.4kg`,
  pl: `Przekształć moją historię wagi w zwykły tekst, dokładnie jeden wpis na linię, w tym formacie:
RRRR-MM-DD <waga>kg

Użyj dat ISO i kilogramów, bez nagłówków, punktorów, notatek i bloków kodu. Przelicz inne jednostki wagi na kilogramy. Przykład:
2026-08-01 78.4kg`,
};

export function ImportWeightPage() {
  const i18n = useI18n();
  const { t } = i18n;
  const router = useRouter();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const parsed = useMemo(() => parseWeightEntries(value), [value]);
  const hasTooManyEntries = parsed.entries.length > MAX_WEIGHT_IMPORT_ENTRIES;
  const mutation = useSaveWeightsMutation();
  const hasErrors = parsed.invalidLines.length > 0;
  const importStatus = getImportStatus(
    parsed.entries.length,
    parsed.invalidLines,
    hasTooManyEntries,
    i18n,
  );

  return (
    <main className={css.page}>
      <div className={css.promptBlock}>
        <div>
          <strong>
            {t({
              en: 'Need help formatting your data?',
              pl: 'Potrzebujesz pomocy z formatem danych?',
            })}
          </strong>
          <p>
            {t({
              en: 'Give the prompt below and your exported data to your preferred AI assistant.',
              pl: 'Przekaż poniższe polecenie i wyeksportowane dane swojemu asystentowi AI.',
            })}
          </p>
        </div>
        <pre>{t(aiPrompt)}</pre>
        <Btn
          icon={<ClipboardIcon aria-hidden='true' />}
          onClick={() => {
            void copyPrompt(t(aiPrompt), i18n);
          }}
          size='sm'
          type='button'
          variant='outlineMain'
        >
          {t({ en: 'Copy prompt', pl: 'Kopiuj polecenie' })}
        </Btn>
      </div>

      <Card as='section'>
        <TypedForm
          className={css.form}
          onSubmit={() => {
            if (parsed.entries.length > 0 && !hasErrors && !hasTooManyEntries) {
              mutation.mutate(
                { data: { entries: parsed.entries } },
                {
                  onSuccess: () => {
                    void router
                      .invalidate()
                      .then(() => navigate({ replace: true, to: '/weight' }))
                      .catch(() => undefined);
                  },
                },
              );
            }
          }}
        >
          <Label text={t({ en: 'Weight data', pl: 'Dane wagi' })}>
            <TextareaInput
              aria-describedby='weight-import-status'
              aria-invalid={hasTooManyEntries}
              className={css.importInput}
              onChange={(event) => setValue(event.currentTarget.value)}
              placeholder={'2026-08-01 78.4kg\n2026-08-02 78.1kg'}
              required
              spellCheck={false}
              value={value}
            />
          </Label>
          <div
            aria-live='polite'
            className={css.importStatus}
            data-error={hasTooManyEntries ? '' : undefined}
            id='weight-import-status'
          >
            {importStatus}
          </div>
          <FormSubmitRow>
            <Btn
              disabled={parsed.entries.length === 0 || hasErrors || hasTooManyEntries}
              loading={mutation.isPending}
              type='submit'
            >
              {t({ en: 'Import', pl: 'Importuj' })} {parsed.entries.length || ''}
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
function getImportStatus(
  entryCount: number,
  invalidLines: number[],
  hasTooManyEntries: boolean,
  { formatNumber, t }: I18n,
) {
  if (hasTooManyEntries) {
    const max = formatNumber(MAX_WEIGHT_IMPORT_ENTRIES);
    return t({
      en: `You can import up to ${max} entries at once.`,
      pl: `Jednorazowo możesz zaimportować maksymalnie ${max} wpisów.`,
    });
  }
  if (invalidLines.length > 0) {
    return invalidLines
      .map((line) => t({ en: `Line ${line} is invalid.`, pl: `Linia ${line} jest nieprawidłowa.` }))
      .join(' ');
  }
  if (entryCount > 0) {
    return t({
      en: `${entryCount} ${pluralEn(entryCount, 'entry', 'entries')} ready to import.`,
      pl: `Gotowe do importu: ${entryCount} ${pluralPl(entryCount, 'wpis', 'wpisy', 'wpisów')}.`,
    });
  }
  return t({ en: 'Format: YYYY-MM-DD 78.4kg', pl: 'Format: RRRR-MM-DD 78.4kg' });
}

async function copyPrompt(prompt: string, { t }: I18n) {
  try {
    await navigator.clipboard.writeText(prompt);
    toastManager.add({
      title: t({ en: 'Prompt copied', pl: 'Skopiowano polecenie' }),
      type: 'success',
    });
  } catch {
    toastManager.add({
      title: t({ en: 'Could not copy prompt', pl: 'Nie udało się skopiować polecenia' }),
      type: 'error',
    });
  }
}
