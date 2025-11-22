'use client';

import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReactQueryProvider } from './ReactQueryProvider';
import { SessionProvider } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" enableSystem>
      <SessionProvider>
        <ReactQueryProvider>
          <NuqsAdapter>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </NuqsAdapter>
        </ReactQueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
};
