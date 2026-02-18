import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { EmployeesList } from '@/features/staff/employees/components/employees-list';
import { getEmployees } from '@/actions/staff/employees/queries';
import dynamic from 'next/dynamic';

// Lazy load QuoteDrawer to reduce initial bundle size
const EmployeeDrawer = dynamic(
  () =>
    import('@/features/staff/employees/components/employee-drawer').then(
      (mod) => mod.EmployeeDrawer,
    ),
  {
    loading: () => null,
  },
);

export const metadata = {
  title: 'Dashboard : Employee View',
};

export default async function EmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getEmployees(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <EmployeesList initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <EmployeeDrawer id={id} open={true} /> : null}
    </Shell>
  );
}
