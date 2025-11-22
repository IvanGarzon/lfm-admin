import { z } from 'zod';

export const ProductStatusSchema = z.enum(['ACTIVE','INACTIVE','OUT_OF_STOCK']);

export type ProductStatusType = `${z.infer<typeof ProductStatusSchema>}`

export default ProductStatusSchema;
