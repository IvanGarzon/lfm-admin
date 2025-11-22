'use client';

import { formatPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text, Mars, Venus } from 'lucide-react';

import { Employee } from '@/prisma/client';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';

import { StatusBadge } from '@/components/shared/status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatCurrency, enumToOptions } from '@/lib/utils';
import { EmployeeStatusSchema } from '@/zod/inputTypeSchemas';

const GENDER_OPTIONS = enumToOptions(GenderSchema.enum);
const EMPLOYEE_STATUS_OPTIONS = enumToOptions(EmployeeStatusSchema.enum);

import { EmployeeAction } from '@/features/employees/employee-action';

// Helper function to format phone numbers consistently
const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';

  // If already in E.164 format, format it
  if (phone.startsWith('+')) {
    return formatPhoneNumber(phone) || phone;
  }

  // Try to parse as Australian number
  try {
    const phoneNumber = parsePhoneNumber(phone, 'AU');
    if (phoneNumber) {
      const e164 = phoneNumber.format('E.164');
      return formatPhoneNumber(e164) || e164 || phone;
    }
    return phone;
  } catch {
    // If parsing fails, assume it's Australian and add +61
    if (phone.startsWith('0')) {
      const e164 = '+61' + phone.substring(1);
      return formatPhoneNumber(e164) || e164;
    }
    return phone;
  }
};

export const baseColumns = [
  {
    id: 'search',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Employee, unknown> }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const { firstName, lastName, email, avatarUrl } = row.original;
      const fullName = `${firstName || ''} ${lastName || ''}`.trim();

      return (
        <Box className="flex items-center gap-3">
          <UserAvatar
            className="h-10 w-10 rounded-full"
            user={{ name: fullName, image: avatarUrl ?? null }}
          />
          <Box>
            <div className="font-semibold text-[0.9rem]">{fullName}</div>
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
    header: ({ column }: { column: Column<Employee, unknown> }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ cell }) => `${formatPhoneDisplay(cell.getValue<Employee['phone']>())}`,
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
          {formatCurrency({ number: cell.getValue<Employee['rate']>() })}
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
      const genderValue = cell.getValue<Employee['gender']>();
      return genderValue ? (
        <StatusBadge
          status={genderValue}
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
      const status = cell.getValue<Employee['status']>();
      return <StatusBadge status={status} />;
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
] satisfies ColumnDef<Employee>[];

import { SearchParams } from 'nuqs/server';

export const createActionsColumn = ({
  onDelete,
  onSendEmail,
  isDeleting,
  isSending,
  searchParams,
}: {
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
  isDeleting: (id: string) => boolean;
  isSending: (id: string) => boolean;
  searchParams: SearchParams;
}): ColumnDef<Employee> => ({
  id: 'actions',
  cell: ({ row }) => {
    const employee = row.original;
    return (
      <EmployeeAction
        employee={employee}
        onDelete={onDelete}
        onSendEmail={onSendEmail}
        isDeleting={isDeleting(employee.id)}
        isSending={isSending(employee.id)}
        searchParams={searchParams}
      />
    );
  },
});
