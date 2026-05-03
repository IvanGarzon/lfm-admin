/**
 * Shared mock for @/components/shared/empty-state.
 *
 * Renders the title and action slot so tests can assert:
 *   - Component presence: getByTestId('empty-state')
 *   - Component absence: queryByTestId('empty-state')
 *   - Action slot:       getByRole('button', { name: /.../ })
 *
 * Usage in tests:
 *   vi.mock('@/components/shared/empty-state', async () => {
 *     const { emptyStateMock } = await import('@/lib/testing/mocks');
 *     return emptyStateMock;
 *   });
 */

export const emptyStateMock = {
  EmptyState: ({
    title,
    action
  }: {
    title: string;
    description: string;
    action?: React.ReactNode;
  }) => (
    <div data-testid='empty-state'>
      <p>{title}</p>
      {action}
    </div>
  )
};
