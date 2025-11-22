import { z } from 'zod';

export const SessionScalarFieldEnumSchema = z.enum(['id','sessionToken','userId','expires','ipAddress','userAgent','isActive','deviceName','deviceType','deviceVendor','deviceModel','osName','osVersion','browserName','browserVersion','country','region','city','latitude','longitude','createdAt','updatedAt']);

export default SessionScalarFieldEnumSchema;
