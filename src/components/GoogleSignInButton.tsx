'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/social-icons';
import { useTransition } from 'react';

export function GoogleSignInButton() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(() => {
      signIn('google', {
        callbackUrl: callbackUrl ?? '/',
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Button
        className="w-full text-sm h-12 bg-white text-dark border cursor-pointer hover:bg-black/5"
        variant="outline"
        type="submit"
        disabled={isPending}
      >
        <GoogleIcon className="size-8" />
        {isPending ? 'Signing in...' : `Continue with Google`}
      </Button>
    </form>
  );
}
