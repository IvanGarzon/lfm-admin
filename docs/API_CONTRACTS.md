# API Contracts Documentation

**Author:** Ivancho Garzon \<Lehenbizico>
**Last Updated:** 2026-04-12
**Status:** Current

---

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
| `search`  | string | 100        | Search query (case-insensitive) |

> **Note:** The search parameter key is `search` across all entities. The older `name` key was used only in early Organization endpoints and has been replaced.

**Example:**

```
/organizations?search=acme
```

**Search Behaviour:**

- Case-insensitive
- Searches across multiple fields (name, email, phone, ABN)
- Automatically sanitised to prevent injection attacks
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
    items: [...],               // Array of items
    pagination: {
      currentPage: 1,           // Current page (1-indexed)
      totalItems: 150,          // Total number of items
      totalPages: 8,            // Total number of pages
      hasNextPage: true,        // Whether there's a next page
      hasPreviousPage: false,   // Whether there's a previous page
      nextPage: 2,              // Next page number, or null
      previousPage: null,       // Previous page number, or null
    }
  }
}
```

> **Note:** The pagination shape is defined in `src/types/pagination.ts` as `PaginationMeta` and produced by `getPaginationMetadata()` in `src/lib/utils.ts`. There is no `pageSize` field — use `totalItems` and `totalPages`.

### Error Response

```typescript
{
  success: false,
  error: "Error message",          // Human-readable error message
  code: "VAL_001",                 // Machine-readable error code
  errors: {                        // Optional field-specific errors
    "fieldName": ["error1", "error2"]
  },
  context: {                       // Optional debug context
    "additionalInfo": "..."
  }
}
```

## Error Handling

### Error Codes

Errors are categorised with specific codes for programmatic handling. All codes are defined in `src/lib/errors.ts`.

#### Authentication & Authorisation (AUTH)

- `AUTH_001` - Unauthorized
- `AUTH_002` - Forbidden
- `AUTH_003` - Session expired
- `AUTH_004` - Invalid credentials

#### Validation (VAL)

- `VAL_001` - Validation error
- `VAL_002` - Invalid input
- `VAL_003` - Required field missing
- `VAL_004` - Invalid format
- `VAL_005` - Value too long
- `VAL_006` - Value too short
- `VAL_007` - Invalid email
- `VAL_008` - Invalid phone
- `VAL_009` - Invalid URL

#### Database (DB)

- `DB_001` - Database error
- `DB_002` - Record not found
- `DB_003` - Duplicate record
- `DB_004` - Foreign key violation
- `DB_005` - Database connection error
- `DB_006` - Database timeout
- `DB_007` - Invalid data type

#### Business Logic (BIZ)

- `BIZ_001` - Business rule violation
- `BIZ_002` - Operation not allowed
- `BIZ_003` - Resource in use
- `BIZ_004` - Insufficient permissions
- `BIZ_005` - Quota exceeded
- `BIZ_006` - Subscription inactive (payment failed or cancelled)
- `BIZ_007` - Plan upgrade required (feature not on current plan)
- `BIZ_008` - Usage limit reached (entity cap for current plan)

> **BIZ_006–008** are reserved for the billing system. See `docs/BILLING_IMPLEMENTATION.md` for full context.

#### Rate Limiting (RATE)

- `RATE_001` - Rate limit exceeded
- `RATE_002` - Too many requests

#### General (SYS)

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
| `search`  | string  | ""      | Search by name, email, phone, or ABN         |
| `status`  | array   | []      | Filter by status (ACTIVE, INACTIVE, DELETED) |
| `page`    | integer | 1       | Page number                                  |
| `perPage` | integer | 20      | Items per page                               |
| `sort`    | array   | []      | Sort criteria                                |

### Sortable Columns

- `name` - Organisation name
- `email` - Email address
- `status` - Status
- `createdAt` - Creation date
- `updatedAt` - Last updated date
- `customersCount` - Number of customers

### Examples

#### Basic Search

```
/organizations?search=acme
```

#### Filter by Status

```
/organizations?status=ACTIVE&status=INACTIVE
```

#### Combined Filtering

```
/organizations?search=tech&status=ACTIVE&sort=name.asc&page=1&perPage=20
```

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
        "phone": "+61 2 1234 5678",
        "address": "123 Main St",
        "city": "Melbourne",
        "state": "VIC",
        "postcode": "3000",
        "country": "Australia",
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
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null
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
6. **Billing errors**: Check for `BIZ_006`/`BIZ_007`/`BIZ_008` codes and surface appropriate upgrade prompts

### For API Developers

1. **Consistent Structure**: All list endpoints must return `{ items, pagination }` using the `PaginationMeta` type
2. **Validate Input**: Always validate and sanitise query parameters using `searchParamsCache.parse()`
3. **Limit Results**: Enforce maximum page size and page number via `validatePaginationParams`
4. **Sanitise Search**: Use `sanitizeSearchQuery` from `src/lib/validation.ts`
5. **Use Error Codes**: Return appropriate error codes from `src/lib/errors.ts`
6. **Tenant scope**: Every repository query must include `tenantId` in the `where` clause

### Security Considerations

1. **Input Validation**: All query parameters are validated and sanitised
2. **SQL Injection**: Protected by Prisma's parameterised queries
3. **XSS Prevention**: Special characters in search are sanitised
4. **Authorisation**: All endpoints wrapped in `withTenantPermission` HOF
5. **Tenant isolation**: Every repository method scopes by `tenantId`
6. **Soft Deletes**: Include `deletedAt: null` filter in all queries

### Performance Tips

1. **Indexing**: Ensure indexes on filter, sort, and search columns and foreign keys
2. **Pagination**: Use offset pagination for consistent URLs
3. **Select**: Always use `select` to limit returned fields — never return full Prisma records
4. **Count + findMany**: Run in `Promise.all` for parallel execution

## Extending This Pattern

When creating new list endpoints:

1. Create filter configuration in `src/filters/{resource}/`
2. Add `searchAndPaginate` method to repository using `getPaginationMetadata`
3. Create server action that uses `searchParamsCache`
4. Return consistent `ActionResult<{Resource}Pagination>` type
5. Document the API contract here

## Related Files

- `src/lib/validation.ts` - Validation utilities and constants
- `src/lib/errors.ts` - Error codes and custom error classes
- `src/lib/error-handler.ts` - Error handling logic
- `src/types/actions.ts` - `ActionResult` type definition
- `src/types/pagination.ts` - `PaginationMeta` type definition
- `src/filters/organizations/organizations-filters.ts` - Example implementation
