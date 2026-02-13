'use client';

import { formatPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { ColumnDef } from '@tanstack/react-table';
import { Text, Mars, Venus } from 'lucide-react';
import Link from 'next/link';

import type { EmployeeListItem } from '@/features/staff/employees/types';
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatCurrency, enumToOptions } from '@/lib/utils';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeeAction } from './employee-action';
import { searchParams, employeeSearchParamsDefaults } from '@/filters/employees/employee-filters';
import { useQueryStates } from 'nuqs';

const GENDER_OPTIONS = enumToOptions(GenderSchema.enum);
const EMPLOYEE_STATUS_OPTIONS = enumToOptions(EmployeeStatusSchema.enum);

// Helper function to format phone numbers consistently
const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';

  if (phone.startsWith('+')) {
    return formatPhoneNumber(phone) || phone;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, 'AU');
    if (phoneNumber) {
      const e164 = phoneNumber.format('E.164');
      return formatPhoneNumber(e164) || e164 || phone;
    }
    return phone;
  } catch {
    if (phone.startsWith('0')) {
      const e164 = '+61' + phone.substring(1);
      return formatPhoneNumber(e164) || e164;
    }
    return phone;
  }
};

function EmployeeLink({ employeeId, name }: { employeeId: string; name: string }) {
  const [currentParams] = useQueryStates(searchParams);

  const queryParts: string[] = [];
  for (const [key, parser] of Object.entries(searchParams)) {
    const value = currentParams[key as keyof typeof searchParams];
    const defaultValue = (employeeSearchParamsDefaults as any)[key];

    if (
      value !== null &&
      value !== undefined &&
      JSON.stringify(value) !== JSON.stringify(defaultValue)
    ) {
      queryParts.push(`${key}=${(parser as any).serialize(value)}`);
    }
  }

  const queryString = queryParts.join('&');
  const basePath = `/staff/employees/${employeeId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export const createEmployeeColumns = (
  onDelete: (id: string) => void,
): ColumnDef<EmployeeListItem>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'search',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const { firstName, lastName, email, avatarUrl, id } = row.original;
      const fullName = `${firstName || ''} ${lastName || ''}`.trim();

      return (
        <Box className="flex items-center gap-3">
          <UserAvatar
            className="h-10 w-10 rounded-full"
            user={{ name: fullName, image: avatarUrl ?? null }}
          />
          <Box>
            <EmployeeLink employeeId={id} name={fullName} />
            <div className="text-[0.8rem] text-gray-400">{email}</div>
          </Box>
        </Box>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Name',
      placeholder: 'Search by name...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'Phone',
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ cell }) => `${formatPhoneDisplay(cell.getValue<EmployeeListItem['phone']>())}`,
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      className: 'tabular-nums',
      displayName: 'Phone',
    },
  },
  {
    id: 'Rate',
    accessorKey: 'rate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
    cell: ({ cell }) => {
      return (
        <Box className="font-medium">
          {formatCurrency({ number: cell.getValue<EmployeeListItem['rate']>() })}
        </Box>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      className: 'text-right',
      displayName: 'Rate',
    },
  },
  {
    id: 'gender',
    accessorKey: 'gender',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gender" />,
    cell: ({ cell }) => {
      const genderValue = cell.getValue<EmployeeListItem['gender']>();
      return genderValue ? (
        <StatusBadge
          status={genderValue as any}
          className={
            genderValue === GenderSchema.enum.MALE
              ? 'bg-blue-50 text-blue-900 ring-blue-500/30'
              : 'bg-pink-50 text-pink-900 ring-pink-500/30'
          }
          icon={genderValue === GenderSchema.enum.MALE ? Mars : Venus}
        />
      ) : null;
    },
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: 'Gender',
      variant: 'multiSelect',
      className: 'text-left',
      options: GENDER_OPTIONS,
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue<EmployeeListItem['status']>();
      return <StatusBadge status={status as any} />;
    },
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      className: 'text-left',
      options: EMPLOYEE_STATUS_OPTIONS,
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const [currentParams] = useQueryStates(searchParams);

      // Convert currentParams to SearchParams (Record<string, string | string[] | undefined>)
      const stringifiedParams: Record<string, string | string[] | undefined> = {};
      for (const [key, value] of Object.entries(currentParams)) {
        if (value === null) {
          stringifiedParams[key] = undefined;
        } else if (Array.isArray(value)) {
          stringifiedParams[key] = value.map(String);
        } else {
          stringifiedParams[key] = String(value);
        }
      }

      return (
        <EmployeeAction
          employee={row.original}
          onDelete={onDelete}
          searchParams={stringifiedParams}
        />
      );
    },
  },
];
