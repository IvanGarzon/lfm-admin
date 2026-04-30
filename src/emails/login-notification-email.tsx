import * as React from 'react';
import { Heading, Hr, Section, Text, Row, Column } from '@react-email/components';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type LoginNotificationEmailProps = {
  userName: string;
  loginAt: Date;
  deviceName: string | null;
  browserName: string | null;
  location: string | null;
  ipAddress: string | null;
};

function LoginNotificationEmailContent({
  userName,
  loginAt,
  deviceName,
  browserName,
  location,
  ipAddress,
}: LoginNotificationEmailProps): React.ReactElement {
  const formattedDate = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(loginAt));

  return (
    <>
      <Heading style={styles.h1}>New sign-in to your account</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        We detected a new sign-in to your account. If this was you, no action is needed.
      </Text>

      <Hr style={styles.hr} />

      <Section>
        <Row style={{ marginBottom: '8px' }}>
          <Column style={{ width: '140px', color: '#6b7280', fontSize: '14px' }}>Time</Column>
          <Column style={{ fontSize: '14px' }}>{formattedDate}</Column>
        </Row>

        {deviceName ? (
          <Row style={{ marginBottom: '8px' }}>
            <Column style={{ width: '140px', color: '#6b7280', fontSize: '14px' }}>Device</Column>
            <Column style={{ fontSize: '14px' }}>{deviceName}</Column>
          </Row>
        ) : null}

        {browserName ? (
          <Row style={{ marginBottom: '8px' }}>
            <Column style={{ width: '140px', color: '#6b7280', fontSize: '14px' }}>Browser</Column>
            <Column style={{ fontSize: '14px' }}>{browserName}</Column>
          </Row>
        ) : null}

        {location ? (
          <Row style={{ marginBottom: '8px' }}>
            <Column style={{ width: '140px', color: '#6b7280', fontSize: '14px' }}>Location</Column>
            <Column style={{ fontSize: '14px' }}>{location}</Column>
          </Row>
        ) : null}

        {ipAddress ? (
          <Row style={{ marginBottom: '8px' }}>
            <Column style={{ width: '140px', color: '#6b7280', fontSize: '14px' }}>
              IP Address
            </Column>
            <Column style={{ fontSize: '14px' }}>{ipAddress}</Column>
          </Row>
        ) : null}
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.text}>
        If you did not sign in, please change your password immediately and contact your
        administrator.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
}

function LoginNotificationEmail(props: LoginNotificationEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText="New sign-in to your account">
      <LoginNotificationEmailContent {...props} />
    </BaseTemplateEmail>
  );
}

LoginNotificationEmail.PreviewProps = {
  userName: 'Jane Smith',
  loginAt: new Date(),
  deviceName: 'MacBook Pro',
  browserName: 'Chrome',
  location: 'Melbourne, VIC, AU',
  ipAddress: '203.0.113.42',
} satisfies LoginNotificationEmailProps;

export default LoginNotificationEmail;
