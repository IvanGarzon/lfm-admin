// import KBar from '@/components/kbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/Layout/app-sidebar';
import { Header } from '@/components/Layout/Header';
import { SessionHeartbeatProvider } from '@/components/providers/SessionHeartbeatProvider';
import { TenantBrandingProvider } from '@/components/providers/TenantBrandingProvider';
import { getTenantBranding } from '@/actions/tenant/queries';

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';
  const branding = await getTenantBranding();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TenantBrandingProvider branding={branding}>
        <SessionHeartbeatProvider />
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </TenantBrandingProvider>
    </SidebarProvider>
  );
}
