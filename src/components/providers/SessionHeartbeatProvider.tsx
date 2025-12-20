'use client';

import { useSessionHeartbeat } from '@/hooks/use-session-heartbeat';

/**
 * Provider component that updates session activity in the background
 * Should be placed in the root layout for authenticated users
 */
export function SessionHeartbeatProvider() {
  useSessionHeartbeat();
  return null;
}
