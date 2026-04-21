import './globals.css';
import '@/lib/suppress-hydration-warnings';

import { site } from '@/config/site';
import { Providers } from '@/providers';
import { Analytics } from '@vercel/analytics/react';
import { constructMetadata } from '@/lib/utils';

import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

interface RootLayoutProps {
  children: Readonly<React.ReactNode>;
}

export const metadata = constructMetadata();

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={site.locale} className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className={`flex flex-col min-h-screen w-full font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
