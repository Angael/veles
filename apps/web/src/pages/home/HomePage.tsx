import { Link } from '@tanstack/react-router';
import {
  ArrowUpRightIcon,
  DumbbellIcon,
  FolderLockIcon,
  ScaleIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './HomePage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MACRO_LABELS } from '@/lib/nutritionLabels';

export function HomePage() {
  const { formatNumber, t } = useI18n();

  return (
    <main className={css.layout}>
      <Card as='article' className={css.hero} data-appear tone='primary'>
        <span aria-hidden='true' className={css.monogram}>
          V
        </span>
        <div aria-hidden='true' className={css.energyLine} />
        <div className={css.heroContent}>
          <h1>
            {t({ en: 'Your data.', pl: 'Twoje dane.' })}
            <br />
            {t({ en: 'In your orbit.', pl: 'Twoje życie.' })}
          </h1>
          <p>
            {t({
              en: 'Veles keeps workouts, body weight, food logging, and shared personal files together in one private hub.',
              pl: 'Veles trzyma treningi, wagę ciała, dziennik jedzenia i wspólne pliki w jednym prywatnym miejscu.',
            })}
          </p>
          <div className={css.buttonRow}>
            <Btn
              icon={<ArrowUpRightIcon aria-hidden='true' size={18} />}
              isLink
              render={<Link to={'/login'} />}
              size='lg'
              variant='main'
            >
              {t({ en: 'Log in', pl: 'Zaloguj się' })}
            </Btn>
          </div>
        </div>
      </Card>

      <Card as='article' className={css.workoutTile} data-appear='1' shadow={false}>
        <div className={css.tileHeading}>
          <DumbbellIcon aria-hidden='true' size={22} />
          <h2>{t({ en: 'Workouts', pl: 'Treningi' })}</h2>
        </div>
        <p>
          {t({
            en: 'Track sessions, exercises, and notes across training blocks.',
            pl: 'Zapisuj treningi, ćwiczenia i notatki w kolejnych blokach treningowych.',
          })}
        </p>
        <div aria-hidden='true' className={css.setSequence}>
          <span>{t({ en: 'WARM', pl: 'ROZGRZEWKA' })}</span>
          <i />
          <span>{t({ en: 'WORK', pl: 'SERIE' })}</span>
          <i />
          <span>{t({ en: 'LOG', pl: 'POSTĘP' })}</span>
        </div>
      </Card>

      <Card as='article' className={css.weightTile} data-appear='2'>
        <div className={css.weightCopy}>
          <div className={css.tileHeading}>
            <ScaleIcon aria-hidden='true' size={22} />
            <h2>{t({ en: 'Body weight', pl: 'Waga ciała' })}</h2>
          </div>
          <p>
            {t({
              en: 'Log privately and see long-term direction without losing the daily detail.',
              pl: 'Zapisuj prywatnie i obserwuj długoterminowy kierunek bez utraty codziennych szczegółów.',
            })}
          </p>
        </div>
        <div aria-hidden='true' className={css.trend}>
          <span className={css.trendValue}>{formatNumber(72.4)}</span>
          <span className={css.trendUnit}>kg</span>
          <svg viewBox='0 0 180 54'>
            <path d='M2 42 C28 35, 38 45, 61 31 S102 35, 123 20 S153 22, 178 8' />
          </svg>
        </div>
      </Card>

      <Card as='article' className={css.foodTile} data-appear='3' shadow={false}>
        <div className={css.tileHeading}>
          <UtensilsIcon aria-hidden='true' size={22} />
          <h2>{t({ en: 'Food logging', pl: 'Dziennik jedzenia' })}</h2>
        </div>
        <p>
          {t({
            en: 'Record meals, calories, and macros with a compact daily view.',
            pl: 'Zapisuj posiłki, kalorie i makroskładniki w zwięzłym widoku dnia.',
          })}
        </p>
        <dl className={css.macros}>
          <div>
            <dt>kcal</dt>
            <dd>{formatNumber(2180)}</dd>
          </div>
          <div>
            <dt>{t(MACRO_LABELS.protein)}</dt>
            <dd>148g</dd>
          </div>
          <div>
            <dt>{t(MACRO_LABELS.fat)}</dt>
            <dd>72g</dd>
          </div>
          <div>
            <dt>{t(MACRO_LABELS.carbs)}</dt>
            <dd>224g</dd>
          </div>
        </dl>
      </Card>

      <Card as='article' className={css.filesTile} data-appear='4'>
        <div className={css.filesCopy}>
          <div className={css.tileHeading}>
            <FolderLockIcon aria-hidden='true' size={22} />
            <h2>{t({ en: 'Shared personal files', pl: 'Wspólne pliki' })}</h2>
          </div>
          <p>
            {t({
              en: 'Keep important files together in private, upload-ready storage.',
              pl: 'Trzymaj ważne pliki razem w prywatnym miejscu.',
            })}
          </p>
        </div>
        <div aria-hidden='true' className={css.fileStack}>
          <span>health.pdf</span>
          <span>progress.jpg</span>
          <span>notes.txt</span>
        </div>
      </Card>
    </main>
  );
}
