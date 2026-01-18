import { z } from 'zod';

export const AddressSchema = z.object({
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  formattedAddress: z.string().min(1, 'Formatted address is required'),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
});

// Schema for validating editable fields in the address dialog
// All fields are optional since Google Places API may not return all components
export const AddressDialogSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
});

export type AddressInput = z.infer<typeof AddressSchema>;
export type AddressDialogInput = z.infer<typeof AddressDialogSchema>;

export const emptyAddress: AddressInput = {
  address1: '',
  address2: '',
  formattedAddress: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  lat: 0,
  lng: 0,
};
