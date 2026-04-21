export const SORTABLE_USER_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'role',
  'status',
  'lastLoginAt',
  'createdAt',
] as const;

export type SortableUserColumn = (typeof SORTABLE_USER_COLUMNS)[number];
