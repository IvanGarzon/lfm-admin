'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useSession } from 'next-auth/react';

export function SidebarUserMenu() {
  const { data: session } = useSession();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                className="h-8 w-8 rounded-lg"
                user={{
                  name: session?.user?.name,
                  image: session?.user?.image || null,
                }}
              />
              <Box className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{session?.user?.name || ''}</span>
                <span className="truncate text-xs">{session?.user?.email || ''}</span>
              </Box>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  className="h-8 w-8 rounded-lg"
                  user={{
                    name: session?.user?.name,
                    image: session?.user?.image || null,
                  }}
                />
                <Box className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name || ''}</span>
                  <span className="truncate text-xs">{session?.user?.email || ''}</span>
                </Box>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
