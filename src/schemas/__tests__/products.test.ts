import { describe, it, expect } from 'vitest';
import {
  CreateProductSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  ProductFiltersSchema,
} from '../products';

// -- CreateProductSchema -------------------------------------------------------

describe('CreateProductSchema', () => {
  const validInput = {
    name: 'Rose Bouquet',
    status: 'ACTIVE',
    price: 49.99,
    stock: 10,
    description: null,
    imageUrl: null,
    availableAt: null,
  };

  it('accepts a valid product', () => {
    expect(() => CreateProductSchema.parse(validInput)).not.toThrow();
  });

  it('rejects a missing name', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a name that exceeds the maximum length', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, name: 'x'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, price: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts a zero price', () => {
    expect(() => CreateProductSchema.parse({ ...validInput, price: 0 })).not.toThrow();
  });

  it('rejects a fractional stock value', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, stock: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative stock value', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, stock: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts a zero stock value', () => {
    expect(() => CreateProductSchema.parse({ ...validInput, stock: 0 })).not.toThrow();
  });

  it('rejects an invalid image URL', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, imageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid image URL', () => {
    expect(() =>
      CreateProductSchema.parse({ ...validInput, imageUrl: 'https://example.com/img.jpg' }),
    ).not.toThrow();
  });

  it('accepts null for optional fields', () => {
    const parsed = CreateProductSchema.parse(validInput);
    expect(parsed.description).toBeNull();
    expect(parsed.imageUrl).toBeNull();
    expect(parsed.availableAt).toBeNull();
  });

  it('rejects an invalid status', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, status: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('accepts OUT_OF_STOCK status', () => {
    expect(() =>
      CreateProductSchema.parse({ ...validInput, status: 'OUT_OF_STOCK' }),
    ).not.toThrow();
  });
});

// -- UpdateProductSchema -------------------------------------------------------

describe('UpdateProductSchema', () => {
  const validInput = {
    id: 'cltest000000000000prod0001',
    name: 'Updated Bouquet',
    status: 'INACTIVE',
    price: 29.99,
    stock: 5,
    description: null,
    imageUrl: null,
    availableAt: null,
  };

  it('accepts a valid update payload', () => {
    expect(() => UpdateProductSchema.parse(validInput)).not.toThrow();
  });

  it('rejects a missing id', () => {
    const { id: _id, ...rest } = validInput;
    const result = UpdateProductSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid id format', () => {
    const result = UpdateProductSchema.safeParse({ ...validInput, id: 'not-a-cuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = UpdateProductSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });
});

// -- DeleteProductSchema -------------------------------------------------------

describe('DeleteProductSchema', () => {
  it('accepts a valid CUID', () => {
    expect(() => DeleteProductSchema.parse({ id: 'cltest000000000000prod0001' })).not.toThrow();
  });

  it('rejects a missing id', () => {
    const result = DeleteProductSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an invalid id format', () => {
    const result = DeleteProductSchema.safeParse({ id: 'not-valid' });
    expect(result.success).toBe(false);
  });
});

// -- ProductFiltersSchema ------------------------------------------------------

describe('ProductFiltersSchema', () => {
  it('accepts empty filters with defaults', () => {
    const result = ProductFiltersSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.search).toBe('');
  });

  it('accepts valid status filter array', () => {
    const result = ProductFiltersSchema.parse({ status: ['ACTIVE', 'INACTIVE'] });
    expect(result.status).toEqual(['ACTIVE', 'INACTIVE']);
  });

  it('rejects an invalid status value in the filter array', () => {
    expect(() => ProductFiltersSchema.parse({ status: ['UNKNOWN'] })).toThrow();
  });

  it('rejects a page value below 1', () => {
    expect(() => ProductFiltersSchema.parse({ page: 0 })).toThrow();
  });

  it('rejects a perPage value above 100', () => {
    expect(() => ProductFiltersSchema.parse({ perPage: 999 })).toThrow();
  });
});
