import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import css from './ConflictNotice.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type UnsavedCopyProps = {
  className?: string;
  /** Explains why the text was not saved; defaults to a generic hint. */
  description?: string;
  onDismiss: () => void;
  text: string;
};

/** Shows the user's rejected text after the latest version replaced it, so they can copy from it. */
export function UnsavedCopy({ className, description, onDismiss, text }: UnsavedCopyProps) {
  const { t } = useI18n();

  return (
    <Card className={className} tone='sky'>
      <div className={css.content}>
        <p className={css.title}>{t({ en: 'Your unsaved text', pl: 'Twój niezapisany tekst' })}</p>
        <p>
          {description ??
            t({
              en: 'The latest version is now in the editor. Copy what you need from your text below.',
              pl: 'W edytorze jest teraz najnowsza wersja. Skopiuj potrzebne fragmenty ze swojego tekstu poniżej.',
            })}
        </p>
        <TextareaInput
          aria-label={t({ en: 'Your unsaved text', pl: 'Twój niezapisany tekst' })}
          readOnly
          rows={4}
          value={text}
        />
        <div className={css.actions}>
          <Btn onClick={onDismiss} size='sm' type='button' variant='outlineMain'>
            {t({ en: 'Dismiss', pl: 'Zamknij' })}
          </Btn>
        </div>
      </div>
    </Card>
  );
}
