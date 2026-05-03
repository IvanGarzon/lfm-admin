/**
 * Shared mock for @/hooks/use-data-table.
 *
 * Usage in tests:
 *   vi.mock('@/hooks/use-data-table', async () => {
 *     const { useDataTableMock } = await import('@/lib/testing/mocks');
 *     return useDataTableMock;
 *   });
 */

export const useDataTableMock = {
  useDataTable: () => ({ table: {} })
};
