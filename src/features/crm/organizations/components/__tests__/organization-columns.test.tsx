// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';

import { createOrganizationColumns } from '../organization-columns';

describe('createOrganizationColumns', () => {
  const onDelete = vi.fn();
  const onEdit = vi.fn();

  it('returns an array of column definitions', () => {
    const columns = createOrganizationColumns(onDelete, onEdit);
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBeGreaterThan(0);
  });

  it('includes expected column ids', () => {
    const columns = createOrganizationColumns(onDelete, onEdit);
    const ids = columns.map((col) => col.id);
    expect(ids).toContain('select');
    expect(ids).toContain('name');
    expect(ids).toContain('status');
    expect(ids).toContain('actions');
  });

  it('works without optional onEdit argument', () => {
    expect(() => createOrganizationColumns(onDelete)).not.toThrow();
  });
});
