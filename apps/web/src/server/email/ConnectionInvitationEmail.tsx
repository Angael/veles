import type { Locale, Localized } from '@/lib/i18n/locale';
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'react-email';

interface ConnectionInvitationEmailProps {
  invitationUrl: string;
  inviterName: string;
  locale: Locale;
  recipientEmail: string;
}

export function ConnectionInvitationEmail({
  invitationUrl,
  inviterName,
  locale,
  recipientEmail,
}: ConnectionInvitationEmailProps) {
  const t = <T,>(text: Localized<T>) => text[locale];

  return (
    <Html dir='ltr' lang={locale}>
      <Head />
      <Preview>
        {t({
          en: `${inviterName} invited you to connect on Veles`,
          pl: `${inviterName} zaprasza Cię do połączenia w Veles`,
        })}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            {t({ en: 'You have been invited to connect', pl: 'Masz zaproszenie do połączenia' })}
          </Heading>
          <Text style={textStyle}>
            <strong>{inviterName}</strong>{' '}
            {t({
              en: 'invited you to connect on Veles.',
              pl: 'zaprasza Cię do połączenia w Veles.',
            })}
          </Text>
          <Text style={textStyle}>
            {t({ en: 'Sign in with', pl: 'Zaloguj się jako' })} <strong>{recipientEmail}</strong>
            {t({ en: ', then accept the invitation.', pl: ', a potem przyjmij zaproszenie.' })}
          </Text>
          <Button href={invitationUrl} style={buttonStyle}>
            {t({ en: 'Accept invitation', pl: 'Przyjmij zaproszenie' })}
          </Button>
          <Hr style={dividerStyle} />
          <Text style={secondaryTextStyle}>
            {t({
              en: 'If the button does not work, copy and paste this link into your browser:',
              pl: 'Jeśli przycisk nie działa, skopiuj ten link i wklej go w przeglądarce:',
            })}
          </Text>
          <Link href={invitationUrl} style={linkStyle}>
            {invitationUrl}
          </Link>
          <Text style={secondaryTextStyle}>
            {t({
              en: 'If you were not expecting this invitation, you can ignore this email.',
              pl: 'Jeśli nie spodziewasz się tego zaproszenia, zignoruj tę wiadomość.',
            })}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#f4f4f5',
  color: '#18181b',
  fontFamily: 'Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px',
};

const headingStyle = {
  fontSize: '24px',
  lineHeight: '32px',
  margin: '0 0 24px',
};

const textStyle = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 700,
  margin: '8px 0 24px',
  padding: '12px 20px',
  textDecoration: 'none',
};

const dividerStyle = {
  borderColor: '#e4e4e7',
  margin: '0 0 24px',
};

const secondaryTextStyle = {
  color: '#52525b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const linkStyle = {
  color: '#2563eb',
  display: 'block',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '24px',
  overflowWrap: 'anywhere' as const,
};
