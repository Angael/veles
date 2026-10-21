import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { ArrowUpRightIcon, LogInIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { HomeFeaturePreview } from './HomeFeaturePreview';
import { homeFeatures } from './homeFeatures';
import css from './HomePage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function HomePage() {
  const { t } = useI18n();

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
              en: 'Veles keeps food, body weight, workouts, recipes, notes, and a private diary together in one hub you can share with family and friends.',
              pl: 'Veles trzyma jedzenie, wagę ciała, treningi, przepisy, notatki i prywatny dziennik w jednym miejscu, które możesz udostępnić rodzinie i znajomym.',
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

      {homeFeatures.map((feature, index) => {
        const Icon = feature.icon;
        const title = t(feature.title);
        const path = feature.hash ? `${feature.to}#${feature.hash}` : feature.to;

        return (
          <Card
            as='article'
            className={clsx(css.feature, css[feature.id])}
            data-appear={String(Math.min(index + 1, 6))}
            key={feature.id}
            shadow={false}
          >
            <div className={css.tileHeading}>
              <Icon aria-hidden='true' size={22} />
              <h2>{title}</h2>
            </div>
            <p>{t(feature.description)}</p>
            <HomeFeaturePreview feature={feature.id} />
            <Link
              aria-label={t({
                en: `Log in to open ${title}`,
                pl: `Zaloguj się, aby otworzyć: ${title}`,
              })}
              className={css.loginLink}
              search={{ redirect: path }}
              to='/login'
            >
              {t({ en: 'Log in to open', pl: 'Zaloguj się, aby otworzyć' })}
              <LogInIcon aria-hidden='true' size={16} />
            </Link>
          </Card>
        );
      })}
    </main>
  );
}
