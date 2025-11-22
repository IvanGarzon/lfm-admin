import { z } from 'zod';
import { GenderSchema } from '../inputTypeSchemas/GenderSchema'
import { EmployeeStatusSchema } from '../inputTypeSchemas/EmployeeStatusSchema'

/////////////////////////////////////////
// EMPLOYEE SCHEMA
/////////////////////////////////////////

export const EmployeeSchema = z.object({
  gender: GenderSchema.nullish(),
  status: EmployeeStatusSchema,
  id: z.cuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  dob: z.coerce.date().nullish(),
  rate: z.number(),
  avatarUrl: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Employee = z.infer<typeof EmployeeSchema>

export default EmployeeSchema;
