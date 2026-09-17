import css from './CalorieFormError.module.css';

export function CalorieFormError({ error }: { error: Error | null }) {
  if (!error) return null;

  return (
    <p className={css.error} role='alert'>
      {error.message}
    </p>
  );
}
