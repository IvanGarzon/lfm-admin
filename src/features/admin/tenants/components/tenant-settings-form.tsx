'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import { updateTenantSettings } from '@/actions/settings/tenant/mutations';
import type { TenantWithSettings } from '@/features/admin/tenants/types';

export function TenantSettingsForm({ tenant }: { tenant: TenantWithSettings }) {
  const s = tenant.settings;

  const [form, setForm] = useState({
    // Business info
    email: s?.email ?? '',
    phone: s?.phone ?? '',
    abn: s?.abn ?? '',
    website: s?.website ?? '',
    // Address
    address: s?.address ?? '',
    city: s?.city ?? '',
    state: s?.state ?? '',
    postcode: s?.postcode ?? '',
    country: s?.country ?? '',
    // Bank details
    bankName: s?.bankName ?? '',
    bsb: s?.bsb ?? '',
    accountNumber: s?.accountNumber ?? '',
    accountName: s?.accountName ?? '',
  });

  const update = useMutation({
    mutationFn: () =>
      updateTenantSettings({
        email: form.email || null,
        phone: form.phone || null,
        abn: form.abn || null,
        website: form.website || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        postcode: form.postcode || null,
        country: form.country || null,
        bankName: form.bankName || null,
        bsb: form.bsb || null,
        accountNumber: form.accountNumber || null,
        accountName: form.accountName || null,
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box className="space-y-6">
        {/* -- Business Info ------------------------------------------------- */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Business Info</h2>
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set('email')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set('phone')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="abn">ABN</Label>
              <Input id="abn" value={form.abn} onChange={set('abn')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" value={form.website} onChange={set('website')} />
            </Box>
          </Box>
        </Card>

        <Separator />

        {/* -- Address ------------------------------------------------------- */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" value={form.address} onChange={set('address')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={set('city')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={set('state')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" value={form.postcode} onChange={set('postcode')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={set('country')} />
            </Box>
          </Box>
        </Card>

        <Separator />

        {/* -- Bank Details -------------------------------------------------- */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bank Details</h2>
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" value={form.bankName} onChange={set('bankName')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" value={form.accountName} onChange={set('accountName')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="bsb">BSB</Label>
              <Input id="bsb" value={form.bsb} onChange={set('bsb')} />
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={set('accountNumber')}
              />
            </Box>
          </Box>
        </Card>

        <Box className="flex justify-end">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
