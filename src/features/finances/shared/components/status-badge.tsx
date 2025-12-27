import { Badge } from '@/components/ui/badge';

/**
 * Configuration for a single status badge
 */
export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Props for the generic StatusBadge component
 */
interface StatusBadgeProps<TStatus extends string> {
  status: TStatus;
  config: Record<TStatus, StatusBadgeConfig>;
  className?: string;
}

/**
 * Generic status badge component for finance entities
 *
 * Renders a status badge with customizable colors, icons, and labels.
 * Used by both quotes and invoices with their specific status configurations.
 *
 * @example
 * ```tsx
 * const quoteConfig = {
 *   DRAFT: { label: 'Draft', variant: 'outline', className: '...', icon: <Icon /> },
 *   SENT: { label: 'Sent', variant: 'outline', className: '...', icon: <Icon /> },
 * };
 *
 * <StatusBadge status="DRAFT" config={quoteConfig} />
 * ```
 */
export function StatusBadge<TStatus extends string>({
  status,
  config,
  className,
}: StatusBadgeProps<TStatus>) {
  const badgeConfig = config[status];

  if (!badgeConfig) {
    console.warn(`No configuration found for status: ${status}`);
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant={badgeConfig.variant}
      className={`${badgeConfig.className || ''} ${className || ''}`.trim()}
    >
      {badgeConfig.icon}
      {badgeConfig.label}
    </Badge>
  );
}
