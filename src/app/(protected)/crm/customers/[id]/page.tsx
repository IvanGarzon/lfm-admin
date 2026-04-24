import dynamic from 'next/dynamic';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { CustomersList } from '@/features/crm/customers/components/customers-list';
import { getCustomers } from '@/actions/crm/customers/queries';

const CustomerDrawer = dynamic(
  () =>
    import('@/features/crm/customers/components/customer-drawer').then((mod) => mod.CustomerDrawer),
  {
    loading: () => null,
  },
);

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getCustomers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <CustomersList initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <CustomerDrawer id={id} open={true} /> : null}
    </Shell>
  );
}
