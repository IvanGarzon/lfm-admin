import { z } from 'zod';

export const QuoteItemAttachmentScalarFieldEnumSchema = z.enum(['id','quoteItemId','fileName','fileSize','mimeType','s3Key','s3Url','uploadedBy','uploadedAt']);

export default QuoteItemAttachmentScalarFieldEnumSchema;
