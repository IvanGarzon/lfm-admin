import { z } from 'zod';

export const AuthSchema = z.object({
  email: z.email({
    error: 'Please enter a valid email address.',
  }),
});

export type AuthFormValues = z.infer<typeof AuthSchema>;
