import { z } from 'zod';

export const EmployeeScalarFieldEnumSchema = z.enum(['id','firstName','lastName','email','phone','gender','dob','rate','status','avatarUrl','createdAt','updatedAt']);

export default EmployeeScalarFieldEnumSchema;
