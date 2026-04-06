// import KBar from '@/components/kbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/Layout/app-sidebar';
import { Header } from '@/components/Layout/Header';
import { SessionHeartbeatProvider } from '@/components/providers/SessionHeartbeatProvider';
import { TenantBrandingProvider } from '@/components/providers/TenantBrandingProvider';
import { getTenantBranding } from '@/actions/tenant/queries';
import { SUPER_ADMIN_TENANT_COOKIE } from '@/lib/action-auth';

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';
  const activeTenantId = cookieStore.get(SUPER_ADMIN_TENANT_COOKIE)?.value;
  const branding = await getTenantBranding();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TenantBrandingProvider branding={branding}>
        <SessionHeartbeatProvider />
        <AppSidebar activeTenantId={activeTenantId} />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </TenantBrandingProvider>
    </SidebarProvider>
  );
}
