import dynamic from 'next/dynamic';
import { delay } from '@/lib/utils';
import { BarGraphSkeleton } from '@/features/overview/components/bar-graph-skeleton';

const BarGraph = dynamic(() => import('@/features/overview/components/bar-graph'), {
  loading: () => <BarGraphSkeleton />,
});

export default async function BarStatsPage() {
  await delay(1000);
  return <BarGraph />;
}
