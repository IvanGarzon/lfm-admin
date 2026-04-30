import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Box } from '@/components/ui/box';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Displays an empty state UI with an icon, title, description, and optional action.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Box className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <Box className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </Box>
      <Box className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      </Box>
      {action ? <Box className="mt-1">{action}</Box> : null}
    </Box>
  );
}
