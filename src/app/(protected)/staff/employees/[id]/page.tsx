import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { EmployeesList } from '@/features/staff/employees/components/employees-list';
import { getEmployees } from '@/actions/staff/employees/queries';
import { getQueryClient } from '@/lib/query-client';
import { EMPLOYEE_KEYS } from '@/features/staff/employees/constants/query-keys';
import { searchParamsCache } from '@/filters/employees/employee-filters';

const EmployeeDrawer = dynamic(
  () =>
    import('@/features/staff/employees/components/employee-drawer').then(
      (mod) => mod.EmployeeDrawer
    ),
  {
    loading: () => null
  }
);

export default async function EmployeePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: EMPLOYEE_KEYS.list(filters),
    queryFn: async () => {
      const result = await getEmployees(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeesList />
        {id ? <EmployeeDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
