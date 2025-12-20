// import KBar from '@/components/kbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/Layout/AppSidebar';
import { Header } from '@/components/Layout/Header';
import { SessionHeartbeatProvider } from '@/components/providers/SessionHeartbeatProvider';

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SessionHeartbeatProvider />
      <AppSidebar />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
