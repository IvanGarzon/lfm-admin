import type { TaskDefinition } from '@/lib/tasks/types';
import { sendEmailFunction } from '@/lib/inngest/functions/send-email';

export const sendEmailTask: TaskDefinition = {
  id: 'send-email',
  name: 'Send Email',
  description: 'Sends emails via Resend API with retry logic',
  category: 'EMAIL',
  schedule: {
    event: 'email/send',
    enabled: true,
  },
  timeout: 300, // 5 minutes
  retries: 3,
  concurrencyLimit: 10,
  inngestFunction: sendEmailFunction,
};
