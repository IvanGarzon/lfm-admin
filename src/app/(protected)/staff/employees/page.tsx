import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { EmployeesList } from '@/features/staff/employees/components/employees-list';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getEmployees } from '@/actions/staff/employees/queries';
import { getQueryClient } from '@/lib/query-client';
import { EMPLOYEE_KEYS } from '@/features/staff/employees/constants/query-keys';
import { searchParamsCache } from '@/filters/employees/employee-filters';

export const metadata = constructMetadata({
  title: 'Employees – lfm dashboard',
  description: 'Admin page to manage employees.'
});

export default async function EmployeesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = searchParamsCache.parse(rawParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: EMPLOYEE_KEYS.list(filters),
    queryFn: async () => {
      const result = await getEmployees(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeesList />
      </HydrationBoundary>
    </Shell>
  );
}
