import type { LucideIcon } from 'lucide-react';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Displays an empty state UI with an icon, title, description, and optional action.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
