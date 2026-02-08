# API Contracts Documentation

This document describes the API contracts for server-side filtering, pagination, and sorting across the application.

## Table of Contents

- [Overview](#overview)
- [Common Patterns](#common-patterns)
- [Query Parameters](#query-parameters)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Organizations API](#organizations-api)
- [Best Practices](#best-practices)

## Overview

All list/collection endpoints follow a consistent pattern for:

- **Filtering**: Search and filter records by specific criteria
- **Pagination**: Limit the number of records returned
- **Sorting**: Order results by one or more fields
- **URL State**: All parameters are reflected in the URL for shareability

## Common Patterns

### Request Flow

```
User Input → URL Params → Server Action → Repository → Database → Response
```

### URL State Management

We use `nuqs` for type-safe URL state management. All filter parameters are:

- Encoded in the URL as query parameters
- Debounced (500ms) to reduce server load
- Type-safe and validated server-side

## Query Parameters

### Pagination Parameters

| Parameter | Type    | Default | Min | Max    | Description                     |
| --------- | ------- | ------- | --- | ------ | ------------------------------- |
| `page`    | integer | 1       | 1   | 10,000 | Current page number (1-indexed) |
| `perPage` | integer | 20      | 1   | 100    | Number of items per page        |

**Example:**

```
/organizations?page=2&perPage=50
```

### Search Parameters

| Parameter | Type   | Max Length | Description                     |
| --------- | ------ | ---------- | ------------------------------- |
| `name`    | string | 100        | Search query (case-insensitive) |

**Example:**

```
/organizations?name=acme
```

**Search Behavior:**

- Case-insensitive
- Searches across multiple fields (name, email, phone, ABN)
- Automatically sanitized to prevent injection attacks
- Control characters removed

### Filter Parameters

Filters are specific to each resource but follow these patterns:

**Status Filter (Array):**

```
/organizations?status=ACTIVE&status=INACTIVE
```

**Enum Values:**

- Must be from the predefined enum
- Invalid values are ignored
- Empty array returns all statuses

### Sort Parameters

Sorting supports multiple columns with ascending/descending order.

**Format:**

```
/organizations?sort=name.asc&sort=createdAt.desc
```

**Syntax:**

- `columnId.asc` - Ascending order
- `columnId.desc` - Descending order
- Multiple sort parameters applied in order

**Allowed Columns:**
Only predefined sortable columns are accepted. Others are ignored.

## Response Format

### Success Response

```typescript
{
  success: true,
  data: {
    items: [...],           // Array of items
    pagination: {
      currentPage: 1,       // Current page (1-indexed)
      pageSize: 20,         // Items per page
      totalItems: 150,      // Total number of items
      totalPages: 8,        // Total number of pages
      hasNextPage: true,    // Whether there's a next page
      hasPreviousPage: false // Whether there's a previous page
    }
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: "Error message",          // Human-readable error message
  code: "VAL_001",                  // Machine-readable error code
  errors: {                         // Optional field-specific errors
    "fieldName": ["error1", "error2"]
  },
  context: {                        // Optional debug context
    "additionalInfo": "..."
  }
}
```

## Error Handling

### Error Codes

Errors are categorized with specific codes for programmatic handling:

#### Authentication & Authorization (1xxx)

- `AUTH_001` - Unauthorized
- `AUTH_002` - Forbidden
- `AUTH_003` - Session expired
- `AUTH_004` - Invalid credentials

#### Validation (2xxx)

- `VAL_001` - Validation error
- `VAL_002` - Invalid input
- `VAL_003` - Required field missing
- `VAL_004` - Invalid format
- `VAL_005` - Value too long
- `VAL_006` - Value too short
- `VAL_007` - Invalid email
- `VAL_008` - Invalid phone
- `VAL_009` - Invalid URL

#### Database (3xxx)

- `DB_001` - Database error
- `DB_002` - Record not found
- `DB_003` - Duplicate record
- `DB_004` - Foreign key violation
- `DB_005` - Database connection error
- `DB_006` - Database timeout
- `DB_007` - Invalid data type

#### Business Logic (4xxx)

- `BIZ_001` - Business rule violation
- `BIZ_002` - Operation not allowed
- `BIZ_003` - Resource in use
- `BIZ_004` - Insufficient permissions
- `BIZ_005` - Quota exceeded

#### Rate Limiting (7xxx)

- `RATE_001` - Rate limit exceeded
- `RATE_002` - Too many requests

#### General (9xxx)

- `SYS_001` - Internal error
- `SYS_002` - Not implemented
- `SYS_003` - Maintenance mode
- `SYS_999` - Unknown error

### HTTP Status Codes (when applicable)

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate, resource in use)
- `422` - Unprocessable Entity (business rule violation)
- `429` - Too Many Requests
- `500` - Internal Server Error

## Organizations API

### Endpoint

```
GET /organizations
```

### Query Parameters

| Parameter | Type    | Default | Description                                  |
| --------- | ------- | ------- | -------------------------------------------- |
| `name`    | string  | ""      | Search by name, email, phone, or ABN         |
| `status`  | array   | []      | Filter by status (ACTIVE, INACTIVE, DELETED) |
| `page`    | integer | 1       | Page number                                  |
| `perPage` | integer | 20      | Items per page                               |
| `sort`    | array   | []      | Sort criteria                                |

### Sortable Columns

- `name` - Organization name
- `email` - Email address
- `status` - Status
- `createdAt` - Creation date
- `updatedAt` - Last updated date
- `customersCount` - Number of customers

### Examples

#### Basic Search

```
/organizations?name=acme
```

Returns organizations where name, email, phone, or ABN contains "acme" (case-insensitive).

#### Filter by Status

```
/organizations?status=ACTIVE&status=INACTIVE
```

Returns only ACTIVE and INACTIVE organizations.

#### Pagination

```
/organizations?page=2&perPage=50
```

Returns page 2 with 50 items per page.

#### Combined Filtering

```
/organizations?name=tech&status=ACTIVE&sort=name.asc&page=1&perPage=20
```

Search for "tech", show only ACTIVE status, sort by name ascending, page 1, 20 per page.

#### Multiple Sort Criteria

```
/organizations?sort=status.desc&sort=name.asc
```

Sort by status descending, then by name ascending.

### Response Example

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cm5abc123",
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1 555-1234",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postcode": "10001",
        "country": "USA",
        "abn": "12345678901",
        "website": "https://acme.com",
        "status": "ACTIVE",
        "customersCount": 42,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z",
        "deletedAt": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Best Practices

### For API Consumers

1. **Always Handle Errors**: Check the `success` field and handle errors appropriately
2. **Use Error Codes**: Use `code` for programmatic error handling, not string matching on `error`
3. **Respect Limits**: Don't exceed `perPage` max (100) or `page` max (10,000)
4. **Debounce Search**: Implement client-side debouncing for search inputs
5. **URL State**: Preserve URL state for shareability and browser back/forward

### For API Developers

1. **Consistent Structure**: All list endpoints must return `{ items, pagination }`
2. **Validate Input**: Always validate and sanitize query parameters
3. **Limit Results**: Enforce maximum page size and page number
4. **Sanitize Search**: Remove control characters and limit length
5. **Use Error Codes**: Return appropriate error codes for all errors
6. **Log Slow Queries**: Monitor and optimize queries over 100ms
7. **Index Properly**: Ensure filtered and sorted columns are indexed

### Security Considerations

1. **Input Validation**: All query parameters are validated and sanitized
2. **SQL Injection**: Protected by Prisma's parameterized queries
3. **XSS Prevention**: Special characters in search are sanitized
4. **Rate Limiting**: Implement rate limiting on search endpoints
5. **Authorization**: Always check user permissions before returning data
6. **Soft Deletes**: Include `deletedAt: null` filter in all queries

### Performance Tips

1. **Indexing**: Ensure indexes on:
   - Filter columns (status, etc.)
   - Sort columns
   - Search columns
   - Foreign keys

2. **Pagination**: Use offset pagination for consistent URLs. For very large datasets (>100K records), consider cursor-based pagination

3. **Caching**: Consider caching frequently accessed pages with short TTL

4. **Query Optimization**:
   - Use `select` to limit returned fields
   - Avoid N+1 queries with `include`
   - Use `_count` for aggregate data
   - Monitor query performance in development

## Extending This Pattern

When creating new list endpoints:

1. Create filter configuration in `/src/filters/{resource}/`
2. Add `searchAndPaginate` method to repository
3. Create server action that uses `searchParamsCache`
4. Validate parameters with `validate{Resource}SearchParams`
5. Return consistent `ActionResult<{Resource}Pagination>` type
6. Document the API contract here

## Related Files

- `/src/lib/validation.ts` - Validation utilities and constants
- `/src/lib/errors.ts` - Error codes and custom error classes
- `/src/lib/error-handler.ts` - Error handling logic
- `/src/types/actions.ts` - ActionResult type definition
- `/src/filters/organizations/organizations-filters.ts` - Example implementation

## Changelog

- **2024-01-30**: Added error codes and enhanced validation
- **2024-01-29**: Initial documentation
