import { CustomerDrawer } from '@/features/crm/customers/components/customer-drawer';

export default async function CustomerModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDrawer id={id} />;
}
