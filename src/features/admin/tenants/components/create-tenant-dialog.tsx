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
import { Box } from '@/components/ui/box';
import { useCreateTenant } from '@/features/admin/tenants/hooks/use-tenant-queries';

export function CreateTenantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const createTenant = useCreateTenant();

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenant.mutate(
      { name: name.trim(), slug: slug.trim() },
      {
        onSuccess: (result) => {
          if (result.success) {
            setName('');
            setSlug('');
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
          <DialogDescription>Add a new tenant to the platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Box className="space-y-4 py-2">
            <Box className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Florist"
                required
              />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-florist"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used to scope data. Lowercase letters, numbers, and hyphens only.
              </p>
            </Box>
          </Box>
          <Box className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTenant.isPending}>
              {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
}
