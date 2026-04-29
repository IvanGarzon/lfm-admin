'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { SignInSchema, type SignInInput } from '@/schemas/auth';
import { initiateSignIn, verifyTwoFactorCode } from '@/actions/auth/mutations';
import { toast } from 'sonner';
import type { SubmitHandler } from 'react-hook-form';

const RESEND_COOLDOWN_SECONDS = 60;

interface SignInFormProps {
  callbackUrl?: string;
}

type Step = 'credentials' | 'otp';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

export function SignInForm({ callbackUrl = '/' }: SignInFormProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SignInInput | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInInput>({
    mode: 'onChange',
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCredentialsSubmit: SubmitHandler<SignInInput> = useCallback(
    async (data) => {
      setIsLoading(true);
      try {
        const result = await initiateSignIn(data);

        if (!result.success) {
          toast.error(result.error ?? 'Sign-in failed. Please try again.');
          return;
        }

        if (!result.data.requiresOtp) {
          const res = await signIn('credentials', {
            email: data.email,
            password: data.password,
            callbackUrl,
            redirect: false,
          });

          if (res?.error) {
            toast.error('Sign-in failed', {
              description: 'Invalid email or password. Please try again.',
            });
          } else if (res?.ok) {
            window.location.href = callbackUrl;
          }
          return;
        }

        setCredentials(data);
        setChallengeToken(result.data.challengeToken);
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } catch {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [callbackUrl],
  );

  const handleVerify = useCallback(async () => {
    if (!challengeToken || otpCode.length !== 6 || !credentials) return;

    setIsVerifying(true);
    setOtpError(null);

    try {
      const result = await verifyTwoFactorCode({ challengeToken, code: otpCode });

      if (!result.success) {
        setOtpError(result.error ?? 'Invalid code. Please try again.');
        return;
      }

      const res = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Sign-in failed. Please try again.');
      } else if (res?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [challengeToken, otpCode, credentials, callbackUrl]);

  const handleResend = useCallback(async () => {
    if (!credentials || resendCooldown > 0) return;

    setIsResending(true);
    setOtpError(null);
    setOtpCode('');

    try {
      const result = await initiateSignIn(credentials);

      if (!result.success) {
        toast.error(result.error ?? 'Failed to resend code. Please try again.');
        return;
      }

      if (result.data.requiresOtp) {
        setChallengeToken(result.data.challengeToken);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success('A new code has been sent to your email.');
      }
    } catch {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [credentials, resendCooldown]);

  const handleBack = useCallback(() => {
    setStep('credentials');
    setChallengeToken(null);
    setCredentials(null);
    setOtpCode('');
    setOtpError(null);
    setResendCooldown(0);
  }, []);

  if (step === 'otp') {
    const email = credentials?.email ?? '';
    const isMaxAttempts = otpError?.includes('Too many') ?? false;
    const isExpired = otpError?.includes('expired') ?? false;
    const showResend = isMaxAttempts || isExpired || resendCooldown === 0;

    return (
      <div className="flex flex-col gap-4 w-full">
        <div>
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <span className="font-medium">{maskEmail(email)}</span>. Enter
            it below to continue.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={(value) => {
              setOtpCode(value);
              setOtpError(null);
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {otpError ? <p className="text-sm text-destructive text-center">{otpError}</p> : null}
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || otpCode.length !== 6}
          className="w-full"
        >
          {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Back
          </button>

          {showResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Sending…'
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend code'}
            </button>
          ) : (
            <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCredentialsSubmit)}
        className="flex flex-col gap-2 w-full"
      >
        <FieldGroup className="gap-1.5 mb-0">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-email">Email</FieldLabel>
                </FieldContent>
                <Input
                  {...field}
                  id="form-rhf-email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup className="gap-1.5 mb-0">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-password">Password</FieldLabel>
                </FieldContent>
                <Input
                  {...field}
                  id="form-rhf-password"
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isLoading} className="w-full mt-2">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
