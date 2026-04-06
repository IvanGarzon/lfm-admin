'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Box } from '@/components/ui/box';
import { useAdminSendInvitation } from '@/features/admin/invitations/hooks/use-invitation-queries';
import { UserRole } from '@/prisma/client';

const INVITABLE_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER] as const;

export function InviteUserDialog({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const sendInvitation = useAdminSendInvitation(tenantId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendInvitation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (result) => {
          if (result.success) {
            setEmail('');
            setRole(UserRole.USER);
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Send an invitation to add a user to this tenant.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Box className="space-y-4 py-2">
            <Box className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          </Box>
          <Box className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvitation.isPending}>
              {sendInvitation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
}
