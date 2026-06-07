import { Card } from '@/components/card/Card';
import css from './PlaceholderPage.module.css';

type PlaceholderPageProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function PlaceholderPage({ description, eyebrow, title }: PlaceholderPageProps) {
  return (
    <main className={css.layout}>
      <Card as='section' className={css.card}>
        <p className={css.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </Card>
    </main>
  );
}
