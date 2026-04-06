'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Building2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Box } from '@/components/ui/box';
import { getAdminTenants } from '@/actions/admin/tenants/queries';
import { useSwitchActiveTenant } from '@/features/admin/tenants/hooks/use-tenant-queries';
import type { TenantListItem } from '@/features/admin/tenants/types';

export function TenantSwitcherDropdown({ activeTenantId }: { activeTenantId: string | undefined }) {
  const switchTenant = useSwitchActiveTenant();

  const { data: result } = useQuery({
    queryKey: ['admin-tenants-switcher'],
    queryFn: () => getAdminTenants(),
    staleTime: 60 * 1000,
  });

  const tenants: TenantListItem[] = result?.success ? result.data : [];
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  const handleSelect = (tenantId: string | null) => {
    switchTenant.mutate(tenantId);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Box className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </Box>
              <Box className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTenant?.name ?? 'All Tenants'}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {activeTenant ? activeTenant.slug : 'Super Admin'}
                </span>
              </Box>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Tenants</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleSelect(null)}>
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>All Tenants</span>
              {activeTenantId === undefined && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            {tenants.length > 0 && <DropdownMenuSeparator />}
            {tenants.map((tenant) => (
              <DropdownMenuItem key={tenant.id} onClick={() => handleSelect(tenant.id)}>
                <Box className="flex aspect-square size-5 items-center justify-center rounded bg-sidebar-primary/10 text-sidebar-primary text-xs font-bold mr-2">
                  {tenant.name.charAt(0).toUpperCase()}
                </Box>
                <span>{tenant.name}</span>
                {tenant.id === activeTenantId && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
