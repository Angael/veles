import { CircleAlertIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './ConflictNotice.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ConflictNoticeProps = {
  className?: string;
  loading?: boolean;
  onKeepMine: () => void;
  onLoadLatest: () => void;
};

/** Explains a rejected stale save. The unsaved text stays in the editor until the user picks. */
export function ConflictNotice({
  className,
  loading = false,
  onKeepMine,
  onLoadLatest,
}: ConflictNoticeProps) {
  const { t } = useI18n();

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
              en: 'A newer version was saved in another tab or device. Your changes are not saved. Load the latest version and copy from your text, or keep yours and replace it.',
              pl: 'Nowsza wersja została zapisana w innej karcie lub na innym urządzeniu. Twoje zmiany nie są zapisane. Wczytaj najnowszą wersję i skopiuj ze swojego tekstu albo zachowaj swoją i zastąp nią tamtą.',
            })}
          </p>
          <div className={css.actions}>
            <Btn loading={loading} onClick={onLoadLatest} size='sm' type='button'>
              {t({ en: 'Load latest version', pl: 'Wczytaj najnowszą wersję' })}
            </Btn>
            <Btn
              disabled={loading}
              onClick={onKeepMine}
              size='sm'
              type='button'
              variant='outlineMain'
            >
              {t({ en: 'Keep my version', pl: 'Zachowaj moją wersję' })}
            </Btn>
          </div>
        </div>
      </div>
    </Card>
  );
}
