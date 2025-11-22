import { z } from 'zod';

export const StatesSchema = z.enum(['ACT','NSW','NT','QLD','SA','TAS','VIC','WA']);

export type StatesType = `${z.infer<typeof StatesSchema>}`

export default StatesSchema;
