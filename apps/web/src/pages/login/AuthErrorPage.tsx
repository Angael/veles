import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, CircleAlertIcon, HomeIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './AuthErrorPage.module.css';

const invitationErrorCode = 'this_account_needs_a_connection_invitation_to_use_veles';

export function AuthErrorPage({ code, description }: { code?: string; description?: string }) {
  const normalizedCode = code?.trim().toLowerCase() ?? '';
  const needsInvitation = normalizedCode === invitationErrorCode;
  const displayCode = code?.replaceAll('_', ' ') || 'Unknown sign-in error';
  const title = needsInvitation ? 'An invitation is needed' : 'We could not finish signing you in';
  const message = needsInvitation
    ? 'This Google account is not connected to Veles yet. Ask a Veles member to invite this email address, then come back and try again.'
    : description?.replaceAll('_', ' ') ||
      'Something interrupted sign-in. Return to the sign-in page and try again.';

  return (
    <main className={css.page}>
      <Card
        aria-labelledby='auth-error-title'
        as='section'
        className={css.card}
        data-appear
        role='alert'
        variant='danger'
      >
        <div className={css.signal}>
          <CircleAlertIcon aria-hidden='true' size={22} strokeWidth={1.8} />
        </div>
        <div className={css.content}>
          <h1 id='auth-error-title'>{title}</h1>
          <p className={css.message}>{message}</p>

          <details className={css.details}>
            <summary>View technical details</summary>
            <code>{displayCode}</code>
          </details>

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
