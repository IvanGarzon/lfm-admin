import * as React from 'react';
import { Heading, Section, Text, Row } from '@react-email/components';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type OtpEmailProps = {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
};

function OtpEmailContent({
  userName,
  otpCode,
  expiresInMinutes,
}: OtpEmailProps): React.ReactElement {
  return (
    <>
      <Heading style={styles.h1}>Your sign-in code</Heading>
      <Text style={styles.text}>Hi {userName},</Text>
      <Text style={styles.text}>
        Use the code below to complete your sign-in. It expires in {expiresInMinutes} minutes.
      </Text>

      <Section style={{ textAlign: 'center', padding: '24px 0' }}>
        <Row>
          <Text style={{ fontSize: '38px', fontWeight: 700, color: '#111827' }}>{otpCode}</Text>
        </Row>
      </Section>

      <Text style={styles.text}>
        If you did not attempt to sign in, please ignore this email. Your account is safe.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
}

function OtpEmail(props: OtpEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText="Your sign-in verification code">
      <OtpEmailContent {...props} />
    </BaseTemplateEmail>
  );
}

OtpEmail.PreviewProps = {
  userName: 'Alex Taylor',
  otpCode: '482951',
  expiresInMinutes: 15,
} satisfies OtpEmailProps;

export default OtpEmail;
