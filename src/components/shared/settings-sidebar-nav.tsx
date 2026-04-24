'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface SettingsSidebarNavItem {
  title: string;
  href: string;
  icon?: ReactNode;
}

interface SettingsSidebarNavProps {
  items: SettingsSidebarNavItem[];
}

export function SettingsSidebarNav({ items }: SettingsSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-2',
            pathname === item.href
              ? 'bg-muted hover:bg-muted font-medium'
              : 'hover:bg-transparent hover:underline',
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
