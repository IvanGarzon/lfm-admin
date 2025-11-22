import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { EmployeesList } from '@/features/employees/employees-list';
import { searchParamsCache } from '@/filters/employees/employee-filters';
import * as employeeService from '@/actions/employees';

export const metadata = {
  title: 'Dashboard : Employee View',
};

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const queryParams = await searchParamsCache.parse(searchParams);
  const searchParamsResolved = await searchParams;

  const employees = await employeeService.getEmployees({
    ...queryParams,
    gender: queryParams.gender || undefined,
    status: queryParams.status || undefined,
    page: queryParams.page.toString(),
    perPage: queryParams.perPage.toString(),
  });

  return (
    <Shell className="gap-2" scrollable>
      <EmployeesList data={employees} searchParams={searchParamsResolved} />
    </Shell>
  );
}
