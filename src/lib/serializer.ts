import superjson from 'superjson';
import { Prisma } from '@/prisma/client';

// Register custom serializer for Prisma Decimal (as number, not string)
// Note: PostgreSQL MONEY type may return values with commas in certain locales
superjson.registerCustom<Prisma.Decimal, number | string>(
  {
    isApplicable: (v): v is Prisma.Decimal => Prisma.Decimal.isDecimal(v),
    serialize: (v) => v.toNumber(),
    deserialize: (v) => {
      // Handle both number and string inputs
      // Remove commas from strings (e.g., "6,400.00" -> "6400.00")
      const cleanValue = typeof v === 'string' ? v.replace(/,/g, '') : v;
      return new Prisma.Decimal(cleanValue);
    },
  },
  'prisma-decimal',
);

// Type helper to transform Prisma types to serialized types
type Serialized<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
    ? string
    : T extends Array<infer U>
      ? Array<Serialized<U>>
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

/**
 * Serialize data for safe client-server transfer
 * Converts Prisma Decimal to numbers and Date objects to ISO strings
 *
 * @example
 * const data = await prisma.employee.findMany();
 * return serialize(data); // All Decimals → numbers, Dates → ISO strings
 */
export function serialize<T>(data: T): Serialized<T> {
  // superjson.serialize() transforms the data and returns { json, meta }
  // The json property contains the serialized values:
  // - Decimal becomes number (via our custom serializer)
  // - Date becomes ISO string (via superjson's built-in serializer)
  // - Objects/Arrays are recursively processed
  const result = superjson.serialize(data);

  // TypeScript can't automatically infer that result.json matches Serialized<T>
  // but at runtime it does, so we need to help TypeScript understand this
  if (result.json === undefined) {
    throw new Error('Serialization failed: result is undefined');
  }

  return result.json as Serialized<T>;
}

/**
 * Wrapper for Server Actions that automatically serializes return values
 *
 * @example
 * export const getEmployees = withSerialization(async (params) => {
 *   return await prisma.employee.findMany();
 * });
 */
export function withSerialization<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
) {
  return async (...args: TArgs): Promise<Serialized<TReturn>> => {
    const result = await fn(...args);
    return serialize(result);
  };
}
