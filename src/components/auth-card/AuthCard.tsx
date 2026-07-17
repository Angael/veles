import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './AuthCard.module.css';

type AuthCardProps = {
  title: string;
  description: string;
  onGoogle?: () => Promise<void>;
  busy: boolean;
  error: string | null;
};

export function AuthCard(props: AuthCardProps) {
  const { busy, description, error, onGoogle, title } = props;

  return (
    <section className={css.authShell}>
      <h1 className={css.authTitle}>{title}</h1>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p>{description}</p>
        </div>

        {error ? <div className={css.errorBox}>{error}</div> : null}

        <Btn disabled={!onGoogle} loading={busy} onClick={() => void onGoogle?.()} variant='main'>
          Continue with Google
        </Btn>
      </Card>
    </section>
  );
}
