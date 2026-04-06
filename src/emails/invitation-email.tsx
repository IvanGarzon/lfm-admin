import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type InvitationEmailProps = {
  inviterName: string;
  tenantName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
};

export const InvitationEmailContent = ({
  inviterName,
  tenantName,
  role,
  acceptUrl,
  expiresAt,
}: InvitationEmailProps) => {
  const formattedExpiry = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(expiresAt));

  const formattedRole = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <>
      <Heading style={styles.h1}>You&apos;ve been invited</Heading>

      <Text style={styles.text}>
        {inviterName} has invited you to join <strong>{tenantName}</strong> as a{' '}
        <strong>{formattedRole}</strong>.
      </Text>

      <Text style={styles.text}>
        Click the button below to accept the invitation and set up your account. This invitation
        expires on {formattedExpiry}.
      </Text>

      <Hr style={styles.hr} />

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={acceptUrl}>
          Accept Invitation
        </Button>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.text}>
        If you were not expecting this invitation, you can safely ignore this email.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
};

export function InvitationEmail(props: InvitationEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText={`You've been invited to join ${props.tenantName}`}>
      <InvitationEmailContent {...props} />
    </BaseTemplateEmail>
  );
}

InvitationEmail.PreviewProps = {
  inviterName: 'Ivan Garzon',
  tenantName: 'Las Flores Melbourne',
  role: 'MANAGER',
  acceptUrl: 'http://localhost:3000/invite/accept?token=example-token',
  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
} satisfies InvitationEmailProps;
