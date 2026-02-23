import { z } from 'zod';
import { formatters } from '@/lib/utils';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
// import { isValidPhoneNumber } from 'react-phone-number-input';

// Create enum arrays for Zod from Prisma enums
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';

const EmployeeSchema = z
  .object({
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
    rate: z
      .number()
      .min(0, { error: 'Rate must be a positive number' })
      .max(1000000, { error: 'Rate must be less than 1,000,000' }),
    status: EmployeeStatusSchema,
    dob: z.date().optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.URL_MAX)
      .pipe(z.url())
      .nullable()
      .or(z.literal('')),
  })
  .refine((data) => !data.dob || data.dob <= new Date(), {
    error: 'Date of birth cannot be in the future.',
    path: ['dob'],
  });

export const CreateEmployeeSchema = EmployeeSchema;
export const UpdateEmployeeSchema = EmployeeSchema.extend({
  id: z.string('Invalid employee ID'),
});

// Output types (after validation/transforms) - used for API calls
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
