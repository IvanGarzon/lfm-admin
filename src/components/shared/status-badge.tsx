import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusBadgeLabel = 'ACTIVE' | 'INACTIVE' | 'FEMALE' | 'MALE';

const statusLabels: {
  value: StatusBadgeLabel;
  label: string;
  variant: React.ComponentProps<typeof Badge>['variant'];
  weight: number;
}[] = [
  {
    value: 'ACTIVE',
    label: 'Active',
    variant: 'success',
    weight: 0.9,
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    variant: 'warning',
    weight: 0.05,
  },
  {
    value: 'FEMALE',
    label: 'Female',
    variant: 'outline',
    weight: 0.9,
  },
  {
    value: 'MALE',
    label: 'Male',
    variant: 'outline',
    weight: 0.9,
  },
];

type StatusBadgeProps = {
  status: StatusBadgeLabel;
  icon?: LucideIcon;
  tooltip?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Badge>['variant'];
};

export function StatusBadge({ status, icon: Icon, tooltip, className, variant }: StatusBadgeProps) {
  const matchedStatus = statusLabels.find((s) => s.value === status);

  const content = (
    <Badge
      variant={variant ?? matchedStatus?.variant ?? 'default'}
      className={cn('items-center', className)}
    >
      {Icon && <Icon className="size-4" />}
      <span>{matchedStatus?.label ?? status}</span>
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
