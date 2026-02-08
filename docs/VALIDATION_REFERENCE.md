# Validation Reference Guide

Quick reference for validation rules and constraints across the application.

## Validation Limits

### Text Fields

| Field Type | Min Length | Max Length | Pattern/Rules                        |
| ---------- | ---------- | ---------- | ------------------------------------ |
| Name       | 2          | 255        | Alphanumeric + spaces, special chars |
| Email      | -          | 255        | Valid email format (RFC 5322)        |
| Phone      | -          | 50         | Numbers, spaces, +, -, (, )          |
| URL        | -          | 2048       | Valid URL format (https://, http://) |
| ABN        | -          | 20         | Alphanumeric                         |
| Address    | -          | 500        | Any characters                       |
| City       | -          | 100        | Any characters                       |
| State      | -          | 50         | Predefined enum or string            |
| Postcode   | -          | 20         | Alphanumeric                         |
| Country    | -          | 100        | Any characters                       |

### Search & Filtering

| Parameter     | Min | Max      | Rules                      |
| ------------- | --- | -------- | -------------------------- |
| Search Query  | 0   | 100      | Control characters removed |
| Page Number   | 1   | 10,000   | Integer only               |
| Per Page      | 1   | 100      | Integer only               |
| Array Filters | 0   | 50 items | Validated against enum     |

### Default Values

```typescript
{
  PAGE_DEFAULT: 1,
  PER_PAGE_DEFAULT: 20,
  SEARCH_QUERY_DEFAULT: '',
  DEBOUNCE_MS: 500,
}
```

## Common Validators

### Using in Schemas

```typescript
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';

const MySchema = z.object({
  name: commonValidators.name('Field name'),
  email: commonValidators.emailOptional(),
  phone: commonValidators.phoneOptional(),
  website: commonValidators.urlOptional(),
  description: commonValidators.stringOptional(VALIDATION_LIMITS.DESCRIPTION_MAX, 'Description'),
});
```

### Using in Filters

```typescript
import { sanitizeSearchQuery, validatePaginationParams } from '@/lib/validation';

// Sanitize search input
const cleanQuery = sanitizeSearchQuery(userInput);

// Validate pagination
const { page, perPage } = validatePaginationParams(rawPage, rawPerPage);
```

## Validation Errors

### Error Messages

Validation errors return structured information:

```typescript
{
  success: false,
  error: "Invalid fieldName: error message",
  code: "VAL_001",
  errors: {
    "fieldName": ["error1", "error2"]
  }
}
```

### Field-Specific Errors

- **Name**: "Name must be at least 2 characters" / "Name is too long"
- **Email**: "Please enter a valid email address" / "Email is too long"
- **Phone**: "Please enter a valid phone number" / "Phone number is too long"
- **URL**: "Please enter a valid URL (e.g., https://example.com)" / "URL is too long"
- **Required**: "Required field is missing"

## Security Features

### Input Sanitization

All inputs are automatically:

1. Trimmed of leading/trailing whitespace
2. Stripped of control characters (\x00-\x1F, \x7F)
3. Limited to maximum length
4. Validated against allowed patterns

### SQL Injection Prevention

- ✅ Prisma parameterized queries (automatic)
- ✅ Input validation and sanitization
- ✅ Type checking via Zod schemas
- ✅ Suspicious pattern detection

### XSS Prevention

- ✅ Input sanitization removes dangerous characters
- ✅ Output encoding handled by React
- ✅ No eval() or innerHTML usage
- ✅ Content Security Policy recommended

## Common Patterns

### Creating a New Validated Endpoint

1. **Define Validation Schema**

```typescript
// schemas/my-resource.ts
import { commonValidators } from '@/lib/validation';

export const MyResourceSchema = z.object({
  name: commonValidators.name('Resource name'),
  email: commonValidators.emailOptional(),
  // ... other fields
});
```

2. **Create Filter Configuration**

```typescript
// filters/my-resource/my-resource-filters.ts
import { sanitizeSearchQuery, validatePaginationParams } from '@/lib/validation';

export const searchParams = {
  name: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // ... other params
};

export function validateMyResourceSearchParams(params) {
  const { page, perPage } = validatePaginationParams(params.page, params.perPage);
  return {
    name: sanitizeSearchQuery(params.name),
    page,
    perPage,
    // ... other params
  };
}
```

3. **Use in Server Action**

```typescript
// actions/my-resource/queries.ts
export async function getMyResources(searchParams: SearchParams) {
  try {
    const parsedParams = searchParamsCache.parse(searchParams);
    const validatedFilters = validateMyResourceSearchParams(parsedParams);
    const result = await repository.searchAndPaginate(validatedFilters);
    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch resources');
  }
}
```

## Testing Validation

### Unit Tests

```typescript
import { sanitizeSearchQuery, validatePaginationParams } from '@/lib/validation';

describe('Validation', () => {
  it('should sanitize search query', () => {
    expect(sanitizeSearchQuery('hello\x00world')).toBe('helloworld');
    expect(sanitizeSearchQuery('  test  ')).toBe('test');
  });

  it('should validate pagination', () => {
    expect(validatePaginationParams(0, 200)).toEqual({ page: 1, perPage: 100 });
    expect(validatePaginationParams(5, 25)).toEqual({ page: 5, perPage: 25 });
  });
});
```

### Integration Tests

```typescript
describe('Organizations API', () => {
  it('should reject invalid pagination', async () => {
    const result = await getOrganizations({ page: -1, perPage: 1000 });
    // Validates that page is clamped to 1, perPage to 100
  });

  it('should sanitize search input', async () => {
    const result = await getOrganizations({ name: 'test\x00injection' });
    // Validates that control characters are removed
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: "Value too long" errors

- **Solution**: Check `VALIDATION_LIMITS` constants and adjust if needed
- **Note**: Limits are set for security and performance

**Issue**: Search not working

- **Solution**: Ensure `sanitizeSearchQuery` is called on the input
- **Check**: Verify the search column is indexed in the database

**Issue**: Pagination incorrect

- **Solution**: Use `validatePaginationParams` to clamp values
- **Check**: Ensure `page` and `perPage` are integers

**Issue**: Validation error messages not showing

- **Solution**: Check that the schema uses `commonValidators`
- **Check**: Ensure error handling returns the `errors` field

## Related Documentation

- [API Contracts](./API_CONTRACTS.md) - Complete API documentation
- [Error Handling](../src/lib/errors.ts) - Error codes and classes
- [Validation Utils](../src/lib/validation.ts) - Validation utilities

## Best Practices

1. ✅ Always use `commonValidators` for consistent validation
2. ✅ Call `sanitizeSearchQuery` on all search inputs
3. ✅ Use `validatePaginationParams` for all pagination
4. ✅ Return structured errors with codes
5. ✅ Log validation failures for monitoring
6. ✅ Keep validation limits reasonable for UX and security
7. ✅ Document custom validation rules
8. ✅ Test edge cases (empty, max length, special chars)

## Update History

- **2024-01-30**: Initial validation reference guide
