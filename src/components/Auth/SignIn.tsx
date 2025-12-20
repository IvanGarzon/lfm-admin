'use client';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from 'src/components/ui/card';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { signIn } from 'next-auth/react';

export function SignIn() {
  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login Test</CardTitle>
          <CardDescription>This demo uses GitHub for authentication.</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4">
          <GoogleSignInButton></GoogleSignInButton>
          
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form
            onSubmit={async (e: any) => {
              e.preventDefault();
              console.log('SignIn form submitted');
              const email = e.target.email.value;
              const password = e.target.password.value;
              console.log('SignIn calling next-auth signIn with:', email);
              await signIn('credentials', { email, password, callbackUrl: '/' });
            }}
            className="flex flex-col gap-2 w-full"
          >
            <div className="grid gap-2">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
            >
              Sign In
            </button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
