import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './AuthErrorPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

type AuthErrorCopy = {
  title: Localized;
  msg: Localized;
};

const AUTH_ERROR_COPY: { default: AuthErrorCopy; [code: string]: AuthErrorCopy } = {
  default: {
    title: { en: 'We could not finish signing you in', pl: 'Nie udało się dokończyć logowania' },
    msg: {
      en: 'Something interrupted sign-in. Return to the sign-in page and try again.',
      pl: 'Coś przerwało logowanie. Wróć do strony logowania i spróbuj ponownie.',
    },
  },
  invalid_invitation: {
    title: { en: 'This invitation is invalid', pl: 'To zaproszenie jest nieprawidłowe' },
    msg: {
      en: 'Ask the person who invited you to send a new invitation.',
      pl: 'Poproś osobę, która Cię zaprosiła, o nowe zaproszenie.',
    },
  },
  this_account_needs_a_connection_invitation_to_use_veles: {
    title: { en: 'An invitation is needed', pl: 'Potrzebne jest zaproszenie' },
    msg: {
      en: 'This Google account is not connected to Veles yet. Ask a Veles member to invite this email address, then come back and try again.',
      pl: 'To konto Google nie jest jeszcze połączone z Veles. Poproś użytkownika Veles o zaproszenie tego adresu e-mail, a potem spróbuj ponownie.',
    },
  },
};

export function AuthErrorPage({ code }: { code?: string }) {
  const { t } = useI18n();
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
        tone='danger'
      >
        <div className={css.content}>
          <h1 id='auth-error-title'>{t(copy.title)}</h1>
          <p className={css.message}>{t(copy.msg)}</p>

          <div className={css.actions}>
            <Btn
              icon={<ArrowLeftIcon aria-hidden='true' size={17} />}
              isLink
              render={<Link to='/login' />}
              variant='main'
            >
              {t({ en: 'Back to sign in', pl: 'Wróć do logowania' })}
            </Btn>
            <Btn
              icon={<HomeIcon aria-hidden='true' size={17} />}
              isLink
              render={<Link to='/' />}
              variant='outlineMain'
            >
              {t({ en: 'Go home', pl: 'Strona główna' })}
            </Btn>
          </div>
        </div>
      </Card>
    </main>
  );
}
