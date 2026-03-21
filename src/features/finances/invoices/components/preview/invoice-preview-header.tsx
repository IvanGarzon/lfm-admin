'use client';

import Image from 'next/image';
import { Box } from '@/components/ui/box';

interface InvoicePreviewHeaderProps {
  invoiceNumber: string;
}

export function InvoicePreviewHeader({ invoiceNumber }: InvoicePreviewHeaderProps) {
  return (
    <Box className="flex items-start justify-between mb-8">
      <Box>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">Invoice</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Number #{invoiceNumber}</p>
      </Box>
      <Box className="relative h-40 w-40">
        <Image
          src="/static/logo-green-800.png"
          alt="Las Flores Melbourne Logo"
          width={160}
          height={160}
          className="h-40 w-auto object-contain"
          priority
        />
      </Box>
    </Box>
  );
}
