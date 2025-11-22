import './globals.css';
import '@/lib/suppress-hydration-warnings';

import { site } from '@/config/site';
import { Providers } from '@/providers';
import { Analytics } from '@vercel/analytics/react';
import { constructMetadata } from '@/lib/utils';

import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Choose weights you need
  display: 'swap',
  variable: '--font-manrope',
});

interface RootLayoutProps {
  children: Readonly<React.ReactNode>;
}

export const metadata = constructMetadata();

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={site.locale} className={manrope.variable} suppressHydrationWarning>
      <body className={`flex flex-col min-h-screen w-full font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
