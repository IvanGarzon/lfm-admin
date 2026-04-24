import { Box } from '@/components/ui/box';

export default function SettingsDisplayPage() {
  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box>
        <h2 className="text-xl font-semibold tracking-tight">Display</h2>
        <p className="text-muted-foreground text-sm">Manage display and accessibility options</p>
      </Box>
    </Box>
  );
}
