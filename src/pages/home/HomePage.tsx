import { Link } from '@tanstack/react-router';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './HomePage.module.css';

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

export function HomePage() {
  return (
    <main className={css.layout}>
      <Card as='article' className={css.hero}>
        <div className={css.heroContent}>
          <p className={css.eyebrow}>Private app</p>
          <h1>Veles</h1>
          <p>Private place for workouts, body weight, food logging, and shared personal files.</p>
          <div className={css.buttonRow}>
            <Btn isLink render={<Link to={'/weight'} />} variant='secondary'>
              Preview weight tracker
            </Btn>
            <Btn isLink render={<Link to={'/login'} />} variant='primary'>
              Open login
            </Btn>
            <Btn isLink render={<Link to={'/signup'} />} variant='secondary'>
              Create account
            </Btn>
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
