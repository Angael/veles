import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './AuthErrorPage.module.css';

type AuthErrorCopy = {
  title: string;
  msg: string;
};

const AUTH_ERROR_COPY: { default: AuthErrorCopy; [code: string]: AuthErrorCopy } = {
  default: {
    title: 'We could not finish signing you in',
    msg: 'Something interrupted sign-in. Return to the sign-in page and try again.',
  },
  this_account_needs_a_connection_invitation_to_use_veles: {
    title: 'An invitation is needed',
    msg: 'This Google account is not connected to Veles yet. Ask a Veles member to invite this email address, then come back and try again.',
  },
};

export function AuthErrorPage({ code }: { code?: string }) {
  const normalizedCode = code?.trim().toLowerCase() ?? 'default';
  const copy = AUTH_ERROR_COPY[normalizedCode] ?? AUTH_ERROR_COPY.default;

  return (
    <main className={css.page}>
      <Card
        aria-labelledby='auth-error-title'
        as='section'
        className={css.panel}
        data-appear
        role='alert'
        variant='danger'
      >
        <div className={css.content}>
          <h1 id='auth-error-title'>{copy.title}</h1>
          <p className={css.message}>{copy.msg}</p>

          <div className={css.actions}>
            <Btn
              icon={<ArrowLeftIcon aria-hidden='true' size={17} />}
              isLink
              render={<Link to='/login' />}
              variant='main'
            >
              Back to sign in
            </Btn>
            <Btn
              icon={<HomeIcon aria-hidden='true' size={17} />}
              isLink
              render={<Link to='/' />}
              variant='outlineMain'
            >
              Go home
            </Btn>
          </div>
        </div>
      </Card>
    </main>
  );
}
