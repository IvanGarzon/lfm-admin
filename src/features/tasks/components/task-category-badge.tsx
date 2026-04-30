import { Monitor, Mail, Trash2, DollarSign, Zap } from 'lucide-react';
import { TaskCategorySchema, type TaskCategory } from '@/zod/schemas/enums/TaskCategory.schema';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface TaskCategoryBadgeProps {
  category: TaskCategory;
  className?: string;
}

/**
 * Configuration for task category badges
 * Maps each task category to its visual representation
 */
const TASK_CATEGORY_CONFIG: Record<TaskCategory, StatusBadgeConfig> = {
  [TaskCategorySchema.enum.SYSTEM]: {
    label: 'System',
    variant: 'outline',
    className: 'bg-muted text-muted-foreground border-border',
    icon: <Monitor aria-hidden="true" className="h-4 w-4" />,
  },
  [TaskCategorySchema.enum.EMAIL]: {
    label: 'Email',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <Mail aria-hidden="true" className="h-4 w-4" />,
  },
  [TaskCategorySchema.enum.CLEANUP]: {
    label: 'Cleanup',
    variant: 'outline',
    className:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
    icon: <Trash2 aria-hidden="true" className="h-4 w-4" />,
  },
  [TaskCategorySchema.enum.FINANCE]: {
    label: 'Finance',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <DollarSign aria-hidden="true" className="h-4 w-4" />,
  },
  [TaskCategorySchema.enum.CUSTOM]: {
    label: 'Custom',
    variant: 'outline',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: <Zap aria-hidden="true" className="h-4 w-4" />,
  },
};

/**
 * Task category badge component
 *
 * Displays a visual badge for task categories with appropriate colours and icons.
 */
export function TaskCategoryBadge({ category, className }: TaskCategoryBadgeProps) {
  return <StatusBadge status={category} config={TASK_CATEGORY_CONFIG} className={className} />;
}
