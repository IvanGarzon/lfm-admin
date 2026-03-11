import dynamic from 'next/dynamic';
import { delay } from '@/lib/utils';
import { AreaGraphSkeleton } from '@/features/overview/components/area-graph-skeleton';

const AreaGraph = dynamic(() => import('@/features/overview/components/area-graph'), {
  loading: () => <AreaGraphSkeleton />,
});

export default async function AreaStats() {
  await delay(2000);
  return <AreaGraph />;
}
