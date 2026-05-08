import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Shell } from '@/components/shared/shell';
import { TenantsList } from '@/features/admin/tenants/components/tenants-list';
import { getAdminTenants } from '@/actions/admin/tenants/queries';
import { getQueryClient } from '@/lib/query-client';
import { TENANT_KEYS } from '@/features/admin/tenants/hooks/use-tenant-queries';

export default async function AdminTenantsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: TENANT_KEYS.lists(),
    queryFn: async () => {
      const result = await getAdminTenants();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TenantsList />
      </HydrationBoundary>
    </Shell>
  );
}
