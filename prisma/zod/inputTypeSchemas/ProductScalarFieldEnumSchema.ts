import { z } from 'zod';

export const ProductScalarFieldEnumSchema = z.enum(['id','imageUrl','name','description','status','price','stock','createdAt','updatedAt','availableAt']);

export default ProductScalarFieldEnumSchema;
