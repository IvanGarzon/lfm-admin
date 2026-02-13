/**
 * Sortable column IDs for organizations
 * Keep this in sync with the column definitions in organization-columns.tsx
 */
export const SORTABLE_ORGANIZATION_COLUMNS = [
  'name',
  'status',
  'customersCount',
  'createdAt',
] as const;

export type SortableOrganizationColumn = (typeof SORTABLE_ORGANIZATION_COLUMNS)[number];
