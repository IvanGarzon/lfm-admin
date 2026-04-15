import { z } from 'zod';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
// import { isValidPhoneNumber } from 'react-phone-number-input';

// Create enum arrays for Zod from Prisma enums
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';

const BaseEmployeeSchema = z
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
    gender: GenderSchema,
    rate: z
      .number()
      .min(0, { error: 'Rate must be a positive number' })
      .max(1000000, { error: 'Rate must be less than 1,000,000' }),
    status: EmployeeStatusSchema,
    dob: z.date(),
    avatarUrl: z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.URL_MAX)
      .pipe(z.url())
      .nullable()
      .or(z.literal('')),
  })
  .refine((data) => data.dob <= new Date(), {
    error: 'Date of birth cannot be in the future.',
    path: ['dob'],
  });

export const CreateEmployeeSchema = BaseEmployeeSchema;
export const UpdateEmployeeSchema = BaseEmployeeSchema.extend({
  id: z.string('Invalid employee ID'),
});
export const DeleteEmployeeSchema = z.object({ id: z.string().cuid() });

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type DeleteEmployeeInput = z.infer<typeof DeleteEmployeeSchema>;
