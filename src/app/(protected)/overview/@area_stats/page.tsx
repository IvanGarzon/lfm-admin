import dynamic from 'next/dynamic';
import { delay } from '@/lib/utils';
import { AreaGraphSkeleton } from '@/features/overview/components/area-graph-skeleton';

const AreaGraph = dynamic(
  () =>
    import('@/features/overview/components/area-graph').then((mod) => ({ default: mod.AreaGraph })),
  {
    loading: () => <AreaGraphSkeleton />,
  },
);

export default async function AreaStats() {
  await delay(2000);
  return <AreaGraph />;
}
