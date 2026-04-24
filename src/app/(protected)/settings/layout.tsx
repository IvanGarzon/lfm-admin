import { Bell, Monitor, Palette, UserCog, Wrench } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SettingsSidebarNav } from '@/components/shared/settings-sidebar-nav';
import { Shell } from '@/components/shared/shell';
import { Box } from '@/components/ui/box';

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Account',
    href: '/settings/account',
    icon: <Wrench size={18} />,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: <Bell size={18} />,
  },
  {
    title: 'Display',
    href: '/settings/display',
    icon: <Monitor size={18} />,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <Box className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </Box>
      <Separator className="my-4 lg:my-6" />
      <Box className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="top-0 lg:sticky lg:w-1/5">
          <SettingsSidebarNav items={sidebarNavItems} />
        </aside>
        <Box className="flex w-full overflow-y-hidden p-1">{children}</Box>
      </Box>
    </Shell>
  );
}
