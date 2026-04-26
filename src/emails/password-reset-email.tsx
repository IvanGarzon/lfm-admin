import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type PasswordResetEmailProps = {
  userName: string;
  requestedByName: string;
  resetUrl: string;
  expiresAt: Date;
};

export const PasswordResetEmailContent = ({
  userName,
  requestedByName,
  resetUrl,
  expiresAt,
}: PasswordResetEmailProps) => {
  const formattedExpiry = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(expiresAt));

  return (
    <>
      <Heading style={styles.h1}>Reset your password</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        <strong>{requestedByName}</strong> has requested a password reset for your account. Click
        the button below to set a new password. This link expires on {formattedExpiry}.
      </Text>

      <Hr style={styles.hr} />

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.text}>
        If you did not request a password reset, you can safely ignore this email. Your password
        will not change.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
};

export function PasswordResetEmail(props: PasswordResetEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText="Reset your password">
      <PasswordResetEmailContent {...props} />
    </BaseTemplateEmail>
  );
}

PasswordResetEmail.PreviewProps = {
  userName: 'Jane Smith',
  requestedByName: 'Ivan Garzon',
  resetUrl: 'http://localhost:3000/reset-password?token=example-token',
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
