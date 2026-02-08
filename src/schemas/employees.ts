import { z } from 'zod';
import { EmployeeStatus, Gender } from '@/prisma/client';
import { formatters } from '@/lib/utils';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
// import { isValidPhoneNumber } from 'react-phone-number-input';

// Create enum arrays for Zod from Prisma enums
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { EmployeeStatusSchema } from '@/zod/inputTypeSchemas/EmployeeStatusSchema';

const EmployeeSchema = z.object({
  firstName: commonValidators.name('First name'),
  lastName: commonValidators.name('Last name'),
  email: commonValidators.email(),
  phone: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.PHONE_MAX, 'Phone number is too long')
    .refine((val) => val.length === 0 || /^[0-9\s\-\+\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
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
  avatarUrl: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.URL_MAX)
    .pipe(z.url())
    .nullable()
    .or(z.literal('')),
});

export const CreateEmployeeSchema = EmployeeSchema;
export const UpdateEmployeeSchema = EmployeeSchema.extend({
  id: z.string('Invalid employee ID'),
});

export type CreateEmployeeFormValues = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeFormValues = z.infer<typeof UpdateEmployeeSchema>;
