import { CircleAlertIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import css from './ConflictNotice.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ConflictNoticeProps = {
  className?: string;
  loading?: boolean;
  onDiscardMine: () => void;
  onLoadLatest: () => void;
  onUseMine: () => void;
  /** The rejected draft. Null until the latest version is loaded. */
  recoveredText: string | null;
};

/**
 * Explains a rejected stale save. First it offers to load the latest version; after that it shows
 * the user's unsaved text so they can copy parts of it, put it back, or drop it.
 */
export function ConflictNotice({
  className,
  loading = false,
  onDiscardMine,
  onLoadLatest,
  onUseMine,
  recoveredText,
}: ConflictNoticeProps) {
  const { t } = useI18n();

  if (recoveredText === null) {
    return (
      <Card className={className} role='alert' tone='danger'>
        <div className={css.notice}>
          <CircleAlertIcon aria-hidden='true' className={css.icon} size={20} strokeWidth={1.9} />
          <div className={css.content}>
            <p className={css.title}>
              {t({ en: 'Changed somewhere else', pl: 'Zmieniono w innym miejscu' })}
            </p>
            <p>
              {t({
                en: 'A newer version was saved in another tab or device. Your changes are not saved, but they stay here.',
                pl: 'Nowsza wersja została zapisana w innej karcie lub na innym urządzeniu. Twoje zmiany nie są zapisane, ale zostają tutaj.',
              })}
            </p>
            <div className={css.actions}>
              <Btn loading={loading} onClick={onLoadLatest} size='sm' type='button'>
                {t({ en: 'Load latest version', pl: 'Wczytaj najnowszą wersję' })}
              </Btn>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card aria-live='polite' className={className} role='status'>
      <div className={css.content}>
        <p className={css.title}>
          {t({ en: 'Latest version loaded', pl: 'Wczytano najnowszą wersję' })}
        </p>
        <p>
          {t({
            en: 'Your unsaved version is below. Copy what you need, or replace the latest version with it.',
            pl: 'Twoja niezapisana wersja jest poniżej. Skopiuj, czego potrzebujesz, albo zastąp nią najnowszą wersję.',
          })}
        </p>
        <TextareaInput
          aria-label={t({ en: 'Your unsaved version', pl: 'Twoja niezapisana wersja' })}
          readOnly
          rows={4}
          value={recoveredText}
        />
        <div className={css.actions}>
          <Btn onClick={onUseMine} size='sm' type='button' variant='outlineMain'>
            {t({ en: 'Use my version', pl: 'Użyj mojej wersji' })}
          </Btn>
          <Btn onClick={onDiscardMine} size='sm' type='button' variant='ghost'>
            {t({ en: 'Discard my version', pl: 'Odrzuć moją wersję' })}
          </Btn>
        </div>
      </div>
    </Card>
  );
}
