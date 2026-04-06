'use client';

import { useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { tenantNavItems, superAdminNavItems } from '@/constants/data';
import { useTenantBranding } from '@/components/providers/TenantBrandingProvider';
import { TenantSwitcherDropdown } from '@/components/Layout/TenantSwitcherDropdown';
import { NavMenuItems } from '@/components/Layout/nav-menu-items';
import { SidebarUserMenu } from '@/components/Layout/sidebar-user-menu';
import { hasPermission } from '@/lib/permissions';
import type { PermissionKey } from '@/lib/permissions';

export function AppSidebar({ activeTenantId }: { activeTenantId?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const branding = useTenantBranding();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const visibleTenantItems = useMemo(() => {
    if (isSuperAdmin && !activeTenantId) {
      return [];
    }

    return tenantNavItems.filter((item) => {
      if (!item.authorizeOnly || item.authorizeOnly.includes('*')) {
        return true;
      }

      return item.authorizeOnly.some((p) => hasPermission(session?.user, p as PermissionKey));
    });
  }, [isSuperAdmin, activeTenantId, session?.user]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {isSuperAdmin ? (
          <TenantSwitcherDropdown activeTenantId={activeTenantId} />
        ) : (
          <Box className="flex gap-2 py-2 text-sidebar-accent-foreground">
            <Box className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </Box>
            <Box className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{branding?.name ?? ''}</span>
            </Box>
          </Box>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {isSuperAdmin && !activeTenantId ? (
          <SidebarGroup>
            <Box className="px-3 py-2 text-xs text-muted-foreground">
              Select a tenant above to browse its data.
            </Box>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <NavMenuItems items={visibleTenantItems} pathname={pathname} />
        </SidebarGroup>

        {isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <NavMenuItems items={superAdminNavItems} pathname={pathname} />
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
