import { Box } from '@/components/ui/box';

export default function SettingsNotificationsPage() {
  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box>
        <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground text-sm">Configure your notification preferences</p>
      </Box>
    </Box>
  );
}
