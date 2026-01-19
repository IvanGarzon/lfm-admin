import { z } from 'zod';
import { EmployeeStatus, Gender } from '@/prisma/client';
import { formatters } from '@/lib/utils';
// import { isValidPhoneNumber } from 'react-phone-number-input';

// Create enum arrays for Zod from Prisma enums
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { EmployeeStatusSchema } from '@/zod/inputTypeSchemas/EmployeeStatusSchema';

const EmployeeSchema = z.object({
  firstName: z.string().trim().min(2, {
    error: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().trim().min(2, {
    error: 'Last name must be at least 2 characters.',
  }),
  email: z.email({
    error: 'Please enter a valid email address.',
  }),
  phone: z.string('Please enter a valid phone number'),
  gender: GenderSchema.optional(),
  rate: z.coerce.number().nonnegative({
    error: 'Rate must be a positive number.',
  }),
  status: EmployeeStatusSchema,
  dob: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          return undefined;
        }
        return date;
      }
      return val;
    }, z.date().optional())
    .refine((date) => !date || date <= new Date(), {
      error: 'Date of birth cannot be in the future.',
    })
    .transform((date) => (date ? formatters.toDateOnlyUTC(date) : undefined)),
  avatarUrl: z.url().nullable().or(z.literal('')),
});

export const CreateEmployeeSchema = EmployeeSchema;
export const UpdateEmployeeSchema = EmployeeSchema.extend({
  id: z.string('Invalid employee ID'),
});

export type CreateEmployeeFormValues = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeFormValues = z.infer<typeof UpdateEmployeeSchema>;
