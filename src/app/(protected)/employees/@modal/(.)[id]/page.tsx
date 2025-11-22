import { EmployeeDrawer } from '@/features/employees/employee-drawer';

export default async function EmployeeModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDrawer id={id} />;
}
