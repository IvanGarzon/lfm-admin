import { TenantSettingsForm } from '@/features/admin/tenants/components/tenant-settings-form';
import { getTenantSettingsForAdmin } from '@/actions/settings/tenant/queries';
import { Box } from '@/components/ui/box';

export default async function TenantSettingsPage() {
  const result = await getTenantSettingsForAdmin();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box>
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <p className="text-muted-foreground text-sm">Update your profile and account settings</p>
      </Box>
      <TenantSettingsForm tenant={result.data} />
    </Box>
  );
}
