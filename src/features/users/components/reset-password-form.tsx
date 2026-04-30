'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { ResetPasswordSchema, type ResetPasswordInput } from '@/schemas/users';
import { resetPassword } from '@/actions/users/mutations';

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    const result = await resetPassword(token, data.newPassword);
    if (!result.success) {
      setServerError(result.error ?? 'Something went wrong.');
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <Card className="w-full max-w-md p-8 space-y-6">
        <Box className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="size-12 text-green-500" aria-hidden="true" />
          <Box>
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your password has been changed successfully.
            </p>
          </Box>
          <Button asChild className="w-full">
            <Link href="/signin">Sign in</Link>
          </Button>
        </Box>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 space-y-6">
      <Box className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Setting a new password for <strong>{email}</strong>
        </p>
      </Box>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>New password</FieldLabel>
                  </FieldContent>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>Confirm new password</FieldLabel>
                  </FieldContent>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Update password
          </Button>
        </form>
      </Form>
    </Card>
  );
}
