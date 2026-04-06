import { Shell } from '@/components/shared/shell';
import { TenantsList } from '@/features/admin/tenants/components/tenants-list';
import { getAdminTenants } from '@/actions/admin/tenants/queries';

export default async function AdminTenantsPage() {
  const result = await getAdminTenants();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <TenantsList initialData={result.data} />
    </Shell>
  );
}
