import { auth } from '@/auth';
import { DashboardLayout } from './DashboardLayout';
import { SignIn } from '@/components/Auth/SignIn.tsx';

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <div>{session ? <DashboardLayout>{children}</DashboardLayout> : <SignIn />}</div>;
}
