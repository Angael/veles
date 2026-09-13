import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './AuthCard.module.css';

type AuthCardProps = {
  description: string;
  googleHref: string;
  title: string;
};

export function AuthCard({ description, googleHref, title }: AuthCardProps) {
  return (
    <section className={css.authShell}>
      <h1 className={css.authTitle}>{title}</h1>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p>{description}</p>
        </div>

        <Btn isLink render={<a href={googleHref} />} variant='main'>
          Continue with Google
        </Btn>
      </Card>
    </section>
  );
}
