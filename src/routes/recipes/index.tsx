import { createFileRoute } from '@tanstack/react-router';
import css from './recipes.module.css';

export const Route = createFileRoute('/recipes/')({
  component: HomePage,
});

function HomePage() {
  return <main className={css.layout}>todo</main>;
}
