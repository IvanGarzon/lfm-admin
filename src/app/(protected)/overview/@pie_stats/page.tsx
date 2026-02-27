import dynamic from 'next/dynamic';
import { delay } from '@/lib/utils';
import { PieGraphSkeleton } from '@/features/overview/components/pie-graph-skeleton';

const PieGraph = dynamic(
  () =>
    import('@/features/overview/components/pie-graph').then((mod) => ({ default: mod.PieGraph })),
  {
    loading: () => <PieGraphSkeleton />,
  },
);

export default async function Stats() {
  await delay(1000);
  return <PieGraph />;
}
