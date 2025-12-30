import { vi, beforeEach } from 'vitest';
import { MockTaskSchedulerDatabase } from './mock';

beforeEach(() => {
  vi.clearAllMocks();
});

global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

export function createMockDatabase(): MockTaskSchedulerDatabase {
  return new MockTaskSchedulerDatabase();
}
