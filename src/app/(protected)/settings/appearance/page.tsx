import { Box } from '@/components/ui/box';

export default function SettingsAppearancePage() {
  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box>
        <h2 className="text-xl font-semibold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground text-sm">
          Customise the look and feel of the application
        </p>
      </Box>
    </Box>
  );
}
