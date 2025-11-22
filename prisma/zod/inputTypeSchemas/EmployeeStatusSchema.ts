import { z } from 'zod';

export const EmployeeStatusSchema = z.enum(['ACTIVE','INACTIVE']);

export type EmployeeStatusType = `${z.infer<typeof EmployeeStatusSchema>}`

export default EmployeeStatusSchema;
