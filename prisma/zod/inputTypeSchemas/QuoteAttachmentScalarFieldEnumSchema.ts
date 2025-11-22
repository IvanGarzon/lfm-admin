import { z } from 'zod';

export const QuoteAttachmentScalarFieldEnumSchema = z.enum(['id','quoteId','fileName','fileSize','mimeType','s3Key','s3Url','uploadedBy','uploadedAt']);

export default QuoteAttachmentScalarFieldEnumSchema;
