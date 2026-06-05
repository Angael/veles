import { Card } from '@/components/card/Card';

type RecipePlaceholderPageProps = {
  body: string;
  title: string;
  subtitle?: string;
};

export function RecipePlaceholderPage({ body, subtitle, title }: RecipePlaceholderPageProps) {
  return (
    <Card as='article'>
      <h1>{title}</h1>
      <p>{body}</p>
      {subtitle ? <p>{subtitle}</p> : null}
    </Card>
  );
}
