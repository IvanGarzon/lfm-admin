import type { EmployeeFilters } from '@/features/staff/employees/types';

export const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...EMPLOYEE_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.details(), id] as const
};
