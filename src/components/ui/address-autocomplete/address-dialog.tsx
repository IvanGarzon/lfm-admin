'use client';

import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type AddressInput, type AddressDialogInput } from '@/schemas/address';
import { updateAndFormatAddress } from './address-utils';
import { AddressForm } from './address-form';

interface AddressDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  address: AddressInput;
  setAddress: (address: AddressInput) => void;
  adrAddress: string;
  dialogTitle: string;
  isLoading: boolean;
}

export default function AddressDialog(props: React.PropsWithChildren<AddressDialogProps>) {
  const { children, dialogTitle, open, setOpen, address, setAddress, adrAddress, isLoading } =
    props;

  /**
   * Handle form submission and save the address
   */
  const handleSave = (data: AddressDialogInput) => {
    const { address1, address2, city, region, postalCode } = data;

    // Only update if values have changed
    if (
      address2 !== address.address2 ||
      postalCode !== address.postalCode ||
      address1 !== address.address1 ||
      city !== address.city ||
      region !== address.region
    ) {
      const newFormattedAddress = updateAndFormatAddress(adrAddress, {
        'street-address': address1 || '',
        address2: address2 || '',
        locality: city || '',
        region: region || '',
        'postal-code': postalCode || '',
      });

      setAddress({
        ...address,
        city: city || '',
        region: region || '',
        address2: address2 || '',
        address1: address1 || '',
        postalCode: postalCode || '',
        formattedAddress: newFormattedAddress,
      });
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="h-52 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <AddressForm address={address} onSubmit={handleSave} onCancel={handleCancel} />
        )}
      </DialogContent>
    </Dialog>
  );
}
