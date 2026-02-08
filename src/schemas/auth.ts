import { z } from 'zod';
import { commonValidators } from '@/lib/validation';

export const AuthSchema = z.object({
  email: commonValidators.email(),
});

export type AuthFormValues = z.infer<typeof AuthSchema>;
