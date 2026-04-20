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
 * Generic status badge component
 *
 * Renders a status badge with customisable colours, icons, and labels.
 * Each feature defines its own config record mapping status → visual representation.
 *
 * @example
 * ```tsx
 * const config: Record<CustomerStatus, StatusBadgeConfig> = {
 *   ACTIVE: { label: 'Active', variant: 'outline', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="h-4 w-4" /> },
 * };
 *
 * <StatusBadge status="ACTIVE" config={config} />
 * ```
 */
export function StatusBadge<TStatus extends string>({
  status,
  config,
  className,
}: StatusBadgeProps<TStatus>) {
  const badgeConfig = config[status];

  if (!badgeConfig) {
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
