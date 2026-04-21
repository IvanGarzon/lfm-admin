'use client';

import { Box } from '@/components/ui/box';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { SignInForm } from '@/features/sessions/components/sign-in-form';

interface SignInProps {
  callbackUrl?: string;
}

export function SignIn({ callbackUrl = '/' }: SignInProps) {
  return (
    <Box className="w-full min-h-screen flex justify-center items-start md:items-center p-8">
      <Box className="w-full max-w-lg flex flex-col gap-6 rounded-xl border bg-card p-10 shadow-sm">
        <Box className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
        </Box>

        <SignInForm callbackUrl={callbackUrl} />

        <Box className="relative w-full">
          <Box className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </Box>
          <Box className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </Box>
        </Box>

        <GoogleSignInButton />
      </Box>
    </Box>
  );
}
