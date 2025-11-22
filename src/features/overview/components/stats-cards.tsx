import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Podcast, Weight, Activity } from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    icon: DollarSign,
  },
  {
    title: 'Subscriptions',
    value: '+2350',
    change: '+180.1% from last month',
    icon: Podcast,
  },
  {
    title: 'Sales',
    value: '+12,234',
    change: '+19% from last month',
    icon: Weight,
  },
  {
    title: 'Active Now',
    value: '+573',
    change: '+201 since last hour',
    icon: Activity,
  },
];

export function StatsCards() {
  return (
    <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ title, value, change, icon: Icon }) => (
        <Card key={title} className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{change}</p>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
