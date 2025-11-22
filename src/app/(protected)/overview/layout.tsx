import { Shell } from '@/components/shared/shell';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from '@/features/overview/components/stats-cards';
import { ChartsGrid } from '@/features/overview/components/charts-grid';

export default function OverViewLayout({
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
    <Shell className="gap-2" scrollable>
      <Box className="space-y-2">
        <Box className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Hi, Welcome back 👋</h2>
          <Box className="hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
            <Button>Download</Button>
          </Box>
        </Box>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <StatsCards />
            <ChartsGrid
              bar_stats={bar_stats}
              area_stats={area_stats}
              pie_stats={pie_stats}
              sales={sales}
            />
          </TabsContent>
        </Tabs>
      </Box>
    </Shell>
  );
}
