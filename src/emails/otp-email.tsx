import { Heading, Hr, Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type OtpEmailProps = {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
};

export const OtpEmailContent = ({ userName, otpCode, expiresInMinutes }: OtpEmailProps) => {
  const digits = otpCode.split('');

  return (
    <>
      <Heading style={styles.h1}>Your sign-in code</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        Use the code below to complete your sign-in. It expires in {expiresInMinutes} minutes.
      </Text>

      <Hr style={styles.hr} />

      <Section style={{ textAlign: 'center', padding: '24px 0' }}>
        <Row>
          {digits.map((digit, i) => (
            <Column key={i} style={{ width: '48px', textAlign: 'center' }}>
              <Text
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#111827',
                  margin: '0',
                  padding: '8px 0',
                  borderBottom: '2px solid #6366f1',
                }}
              >
                {digit}
              </Text>
            </Column>
          ))}
        </Row>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.text}>
        If you did not attempt to sign in, please ignore this email. Your account is safe.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
};

export function OtpEmail(props: OtpEmailProps): React.ReactElement {
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
