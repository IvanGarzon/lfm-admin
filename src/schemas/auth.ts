import { z } from 'zod';
import { commonValidators } from '@/lib/validation';

export const AuthSchema = z.object({
  email: commonValidators.email(),
});

export type AuthFormValues = z.infer<typeof AuthSchema>;

export const SignInSchema = z.object({
  email: commonValidators.email(),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof SignInSchema>;

export const OtpVerifySchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token is required'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
