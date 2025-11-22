import { Box } from '@/components/ui/box';

export function ChartsGrid({
  bar_stats,
  area_stats,
  pie_stats,
  sales,
}: {
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
  pie_stats: React.ReactNode;
  sales: React.ReactNode;
}) {
  return (
    <Box className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Box className="col-span-4">{bar_stats}</Box>
      <Box className="col-span-4 md:col-span-3">{sales}</Box>
      <Box className="col-span-4">{area_stats}</Box>
      <Box className="col-span-4 md:col-span-3">{pie_stats}</Box>
    </Box>
  );
}
