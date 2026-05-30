import { Link, createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/Card';
import css from './index.module.css';

const featureCards = [
  {
    title: 'Workout tracker',
    description: 'Track sessions, exercises, and notes across training blocks.',
    accent: '01',
  },
  {
    title: 'Weight tracker',
    description: 'Log body weight privately and watch long-term trends.',
    accent: '02',
  },
  {
    title: 'Food tracker',
    description: 'Record meals, calories, and macros.',
    accent: '03',
  },
  {
    title: 'Shared cloud storage',
    description: 'Keep personal files in one place with upload-ready storage plumbing.',
    accent: '04',
  },
] as const;

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className={css.layout}>
      <Card as='article' className={css.hero}>
        <div className={css.heroContent}>
          <p className={css.eyebrow}>Private app</p>
          <h1>Veles</h1>
          <p>Private place for workouts, body weight, food logging, and shared personal files.</p>
          <div className={css.buttonRow}>
            <Link className={css.secondaryButton} to={'/weight' as never}>
              Preview weight tracker
            </Link>
            <Link className={css.primaryButton} to={'/login' as never}>
              Open login
            </Link>
            <Link className={css.secondaryButton} to={'/signup' as never}>
              Create account
            </Link>
          </div>
        </div>
      </Card>

      {featureCards.map((card) => (
        <Card as='article' className={css.tile} compact key={card.title}>
          <div className={css.tileAccent}>{card.accent}</div>
          <h2>{card.title}</h2>
          <p>{card.description}</p>
        </Card>
      ))}
    </main>
  );
}
