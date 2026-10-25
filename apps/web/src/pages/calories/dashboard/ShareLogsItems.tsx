import type { CalorieLog } from '../calories.api';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import css from './ShareLogsAction.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  gramsById: Record<string, number | null>;
  logs: CalorieLog[];
  onGramsChange: (id: string, grams: number | null) => void;
};

/** Lists the logs being shared with a grams input each, so the sender can share a different portion. */
export function ShareLogsItems({ gramsById, logs, onGramsChange }: Props) {
  const { formatWhole, t } = useI18n();

  return (
    <ul className={css.items}>
      {logs.map((entry) => {
        const grams = gramsById[entry.id] ?? null;
        const kcal =
          entry.grams && grams !== null ? (entry.kcal * grams) / entry.grams : entry.kcal;
        return (
          <li className={css.item} key={entry.id}>
            <div className={css.itemText}>
              <strong>{entry.name}</strong>
              <span>{formatWhole(kcal)} kcal</span>
            </div>
            {entry.grams === null ? (
              <span className={css.custom}>{t({ en: 'Custom entry', pl: 'Własny wpis' })}</span>
            ) : (
              <div className={css.gramsField}>
                <NumberInput
                  aria-label={t({ en: `Grams of ${entry.name}`, pl: `Gramy: ${entry.name}` })}
                  min={0.01}
                  onValueChange={(value) => onGramsChange(entry.id, value)}
                  size='sm'
                  value={grams}
                />
                <span aria-hidden='true'>g</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
