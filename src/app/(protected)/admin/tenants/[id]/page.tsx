import { notFound } from 'next/navigation';
import { Shell } from '@/components/shared/shell';
import { TenantDetail } from '@/features/admin/tenants/components/tenant-detail';
import { getAdminTenantById } from '@/actions/admin/tenants/queries';

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdminTenantById(id);

  if (!result.success) {
    notFound();
  }

  return (
    <Shell scrollable>
      <TenantDetail tenant={result.data.tenant} users={result.data.users} />
    </Shell>
  );
}
