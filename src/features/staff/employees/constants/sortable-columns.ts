/**
 * Sortable column IDs for employees
 * Keep this in sync with the column definitions in employee-columns.tsx
 */
export const SORTABLE_EMPLOYEE_COLUMNS = ['firstName', 'lastName', 'status', 'gender'] as const;

export type SortableEmployeeColumn = (typeof SORTABLE_EMPLOYEE_COLUMNS)[number];
