import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  DumbbellIcon,
  FolderLockIcon,
  LogInIcon,
  ScaleIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './HomePage.module.css';

const chapters = [
  {
    number: '01',
    title: 'Train with context',
    description: 'Keep workouts, exercises, and the notes that explain how a session really felt.',
    icon: DumbbellIcon,
  },
  {
    number: '02',
    title: 'Follow the long view',
    description: 'Log body weight privately and read the trend beyond any single day.',
    icon: ScaleIcon,
  },
  {
    number: '03',
    title: 'Record what fuels you',
    description:
      'Capture food, calories, and macros without turning every meal into a performance.',
    icon: UtensilsIcon,
  },
  {
    number: '04',
    title: 'Keep personal files close',
    description: 'Share and keep personal files alongside the records they belong with.',
    icon: FolderLockIcon,
  },
] as const;

export function HomePage() {
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby='home-title'>
        <div className={css.heroLead}>
          <h1 id='home-title'>
            Your life,
            <span>kept in view.</span>
          </h1>
          <p className={css.intro}>
            Veles is a private field journal for the facts that shape your days: workouts, body
            weight, food, and personal files.
          </p>
          <div className={css.actions}>
            <Btn
              isLink
              render={<Link to={'/weight'} />}
              variant='main'
              size='lg'
              icon={<ScaleIcon aria-hidden='true' />}
            >
              Preview weight tracker
            </Btn>
            <Btn
              isLink
              render={<Link to={'/login'} />}
              variant='outlineMain'
              size='lg'
              icon={<LogInIcon aria-hidden='true' />}
            >
              Log in
            </Btn>
          </div>
        </div>

        <aside className={css.fieldNote} aria-label='A note on privacy'>
          <div className={css.orbit} aria-hidden='true'>
            <span>01</span>
            <span>02</span>
            <span>03</span>
            <span>04</span>
          </div>
          <p>
            <strong>Private by purpose.</strong>
            A quieter place to notice patterns, preserve context, and keep your own record.
          </p>
        </aside>
      </section>

      <section className={css.chapters} aria-labelledby='chapters-title'>
        <header className={css.sectionHeading}>
          <h2 id='chapters-title'>Four chapters, one record</h2>
          <p>Useful on their own. More revealing when read together.</p>
        </header>

        <div className={css.chapterGrid}>
          {chapters.map(({ number, title, description, icon: Icon }, index) => (
            <Card
              as='article'
              className={css.chapter}
              key={title}
              shadow={false}
              variant={index === 1 ? 'primary' : 'default'}
            >
              <div className={css.chapterMeta}>
                <span>{number}</span>
                <Icon aria-hidden='true' />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className={css.closing}>
        <p>Start with a single measurement. Let the record become useful over time.</p>
        <Link to={'/weight'} className={css.textLink}>
          Open the weight preview
          <ArrowRightIcon aria-hidden='true' />
        </Link>
      </footer>
    </main>
  );
}
