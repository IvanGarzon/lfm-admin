'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InviteUserDialog } from '@/features/admin/tenants/components/invite-user-dialog';
import {
  useUpdateTenant,
  useSuspendTenant,
  useActivateTenant,
} from '@/features/admin/tenants/hooks/use-tenant-queries';
import type { TenantWithSettings } from '@/features/admin/tenants/types';
import type { UserListItem } from '@/features/admin/users/types';
import type { TenantStatus } from '@/prisma/client';

function statusVariant(status: TenantStatus) {
  return status === 'ACTIVE' ? 'success' : 'destructive';
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ');
}

export function TenantDetail({
  tenant,
  users,
}: {
  tenant: TenantWithSettings;
  users: UserListItem[];
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);

  const updateTenant = useUpdateTenant(tenant.id);
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenant.mutate({ name: name.trim(), slug: slug.trim() });
  };

  const handleToggleStatus = () => {
    if (tenant.status === 'ACTIVE') {
      if (!confirm(`Suspend "${tenant.name}"? Users will lose access.`)) return;
      suspendTenant.mutate(tenant.id);
    } else {
      activateTenant.mutate(tenant.id);
    }
  };

  return (
    <Box className="space-y-6 min-w-0 w-full">
      {/* -- Header ---------------------------------------------------------- */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/tenants"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Box>
            <Box className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              <Badge variant={statusVariant(tenant.status)}>
                {tenant.status.charAt(0) + tenant.status.slice(1).toLowerCase()}
              </Badge>
            </Box>
            <p className="text-muted-foreground text-sm font-mono">{tenant.slug}</p>
          </Box>
        </Box>
        <Box className="flex gap-2 shrink-0">
          <Button
            variant={tenant.status === 'ACTIVE' ? 'destructive' : 'default'}
            onClick={handleToggleStatus}
            disabled={suspendTenant.isPending || activateTenant.isPending}
          >
            {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </Box>
      </Box>

      {/* -- Edit form ------------------------------------------------------- */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <form onSubmit={handleSave}>
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </Box>
          </Box>
          <Box className="flex justify-between items-center mt-4">
            <p className="text-xs text-muted-foreground">
              Created {format(new Date(tenant.createdAt), 'dd MMM yyyy')}
            </p>
            <Button type="submit" disabled={updateTenant.isPending}>
              {updateTenant.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Card>

      <Separator />

      {/* -- Users ----------------------------------------------------------- */}
      <Box>
        <Box className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </Box>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No users yet. Invite someone to get started.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel(user.role)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <InviteUserDialog tenantId={tenant.id} open={showInvite} onOpenChange={setShowInvite} />
    </Box>
  );
}
