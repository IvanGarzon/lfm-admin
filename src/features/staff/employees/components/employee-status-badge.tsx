import { CheckCircle2, CircleDashed, Pause, Mars, Venus, User } from 'lucide-react';
import type { EmployeeStatus } from '@/prisma/client';
import type { Gender } from '@/zod/schemas/enums/Gender.schema';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

// -- Employee status --------------------------------------------------------

type EmployeeStatusBadgeProps = {
  status: EmployeeStatus;
  className?: string;
};

/**
 * Configuration for employee status badges
 * Maps each employee status to its visual representation
 */
const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CheckCircle2 aria-hidden="true" className="h-4 w-4" />,
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    icon: <CircleDashed aria-hidden="true" className="h-4 w-4" />,
  },
  ON_LEAVE: {
    label: 'On Leave',
    variant: 'outline',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    icon: <Pause aria-hidden="true" className="h-4 w-4" />,
  },
};

/**
 * Employee status badge component
 *
 * Displays a visual badge for employee statuses with appropriate colours and icons.
 */
export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  return <StatusBadge status={status} config={EMPLOYEE_STATUS_CONFIG} className={className} />;
}

// -- Gender badge -----------------------------------------------------------

type GenderBadgeProps = {
  gender: Gender;
  className?: string;
};

/**
 * Configuration for gender badges
 */
const GENDER_CONFIG: Record<Gender, StatusBadgeConfig> = {
  MALE: {
    label: 'Male',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <Mars aria-hidden="true" className="h-4 w-4" />,
  },
  FEMALE: {
    label: 'Female',
    variant: 'outline',
    className:
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800',
    icon: <Venus aria-hidden="true" className="h-4 w-4" />,
  },
  OTHER: {
    label: 'Other',
    variant: 'outline',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: <User aria-hidden="true" className="h-4 w-4" />,
  },
};

/**
 * Gender badge component
 */
export function GenderBadge({ gender, className }: GenderBadgeProps) {
  return <StatusBadge status={gender} config={GENDER_CONFIG} className={className} />;
}
