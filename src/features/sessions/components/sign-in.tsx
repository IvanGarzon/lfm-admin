'use client';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { SignInForm } from '@/features/sessions/components/sign-in-form';

interface SignInProps {
  callbackUrl?: string;
}

export function SignIn({ callbackUrl = '/' }: SignInProps) {
  return (
    <Box className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4">
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
        </CardFooter>
      </Card>
    </Box>
  );
}
