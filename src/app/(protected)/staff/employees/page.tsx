import { SearchParams } from 'nuqs/server';
import { EmployeesList } from '@/features/staff/employees/components/employees-list';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getEmployees } from '@/actions/staff/employees/queries';

export const metadata = constructMetadata({
  title: 'Employees – lfm dashboard',
  description: 'Admin page to manage employees.',
});

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getEmployees(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <EmployeesList initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
