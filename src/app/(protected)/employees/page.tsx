import { SearchParams } from 'nuqs/server';
import { EmployeesList } from '@/features/employees/employees-list';
import { Shell } from '@/components/shared/shell';
import { searchParamsCache } from '@/filters/employees/employee-filters';
import { constructMetadata } from '@/lib/utils';
import { getEmployees } from '@/actions/employees';

export const metadata = constructMetadata({
  title: 'Employees – lfm dashboard',
  description: 'Admin page to manage employees.',
});

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const queryParams = await searchParamsCache.parse(searchParams);
  const searchParamsResolved = await searchParams;

  const employees = await getEmployees({
    ...queryParams,
    gender: queryParams.gender ?? undefined,
    status: queryParams.status ?? undefined,
    page: queryParams.page.toString(),
    perPage: queryParams.perPage.toString(),
  });

  return (
    <Shell className="gap-2" scrollable>
      <EmployeesList data={employees} searchParams={searchParamsResolved} />
    </Shell>
  );
}
