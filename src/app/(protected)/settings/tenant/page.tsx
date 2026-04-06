import { Shell } from '@/components/shared/shell';
import { TenantSettingsForm } from '@/features/admin/tenants/components/tenant-settings-form';
import { getTenantSettingsForAdmin } from '@/actions/settings/tenant/queries';

export default async function TenantSettingsPage() {
  const result = await getTenantSettingsForAdmin();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <div className="space-y-4 min-w-0 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your business information and branding
          </p>
        </div>
        <TenantSettingsForm tenant={result.data} />
      </div>
    </Shell>
  );
}
