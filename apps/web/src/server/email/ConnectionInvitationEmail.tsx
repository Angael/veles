import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'react-email';

interface ConnectionInvitationEmailProps {
  invitationUrl: string;
  inviterName: string;
  recipientEmail: string;
}

export function ConnectionInvitationEmail({
  invitationUrl,
  inviterName,
  recipientEmail,
}: ConnectionInvitationEmailProps) {
  return (
    <Html dir='ltr' lang='en'>
      <Head />
      <Preview>{inviterName} invited you to connect on Veles</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>You have been invited to connect</Heading>
          <Text style={textStyle}>
            <strong>{inviterName}</strong> invited you to connect on Veles.
          </Text>
          <Text style={textStyle}>
            Sign in with <strong>{recipientEmail}</strong>, then accept the invitation.
          </Text>
          <Button href={invitationUrl} style={buttonStyle}>
            Accept invitation
          </Button>
          <Hr style={dividerStyle} />
          <Text style={secondaryTextStyle}>
            If the button does not work, copy and paste this link into your browser:
          </Text>
          <Link href={invitationUrl} style={linkStyle}>
            {invitationUrl}
          </Link>
          <Text style={secondaryTextStyle}>
            If you were not expecting this invitation, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#f5f5f5',
  color: '#171717',
  fontFamily: 'Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
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
  backgroundColor: '#171717',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 700,
  margin: '8px 0 24px',
  padding: '12px 20px',
  textDecoration: 'none',
};

const dividerStyle = {
  borderColor: '#e5e5e5',
  margin: '0 0 24px',
};

const secondaryTextStyle = {
  color: '#525252',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const linkStyle = {
  color: '#171717',
  display: 'block',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '24px',
  overflowWrap: 'anywhere' as const,
};
