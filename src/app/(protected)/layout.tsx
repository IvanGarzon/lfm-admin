import { DashboardLayout } from '@/components/Layout/DashboardLayout';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
