'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { acceptInvitation } from '@/actions/invitations/queries';
import type { InvitationWithTenant } from '@/features/admin/invitations/types';

export function AcceptInviteForm({
  invitation,
  token,
}: {
  invitation: InvitationWithTenant;
  token: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const accept = useMutation({
    mutationFn: () => acceptInvitation(token, { firstName, lastName, password }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Account created. Please sign in.');
      router.push('/');
    },
    onError: () => toast.error('Failed to accept invitation'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    accept.mutate();
  };

  return (
    <Card className="w-full max-w-md p-8 space-y-6">
      <Box className="text-center space-y-1">
        <h1 className="text-2xl font-bold">You&apos;re invited</h1>
        <p className="text-muted-foreground text-sm">
          Join <strong>{invitation.tenant.name}</strong> as{' '}
          {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()}
        </p>
        <p className="text-sm text-muted-foreground">{invitation.email}</p>
      </Box>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Box className="grid grid-cols-2 gap-3">
          <Box className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Box>
          <Box className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Box>
        </Box>
        <Box className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </Box>
        <Box className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </Box>
        <Button type="submit" className="w-full" disabled={accept.isPending}>
          {accept.isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Card>
  );
}
