'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { updateSessionHeartbeat } from '@/actions/sessions/mutations';
import { logger } from '@/lib/logger';

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const ACTIVITY_DEBOUNCE = 30 * 1000; // 30 seconds - minimum time between activity-triggered updates

/**
 * Hook to periodically update the session's lastActiveAt timestamp
 * This replaces the middleware approach which had issues with Edge Runtime
 */
export function useSessionHeartbeat() {
  const { data: session, status } = useSession();
  const lastActivityUpdateRef = useRef<number>(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use a stable boolean so the effect doesn't re-run on session object reference changes
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void updateHeartbeat();

    const interval = setInterval(() => void updateHeartbeat(), HEARTBEAT_INTERVAL);

    const handleActivity = () => {
      const now = Date.now();

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      if (now - lastActivityUpdateRef.current >= ACTIVITY_DEBOUNCE) {
        lastActivityUpdateRef.current = now;
        void updateHeartbeat();
      } else {
        activityTimeoutRef.current = setTimeout(() => {
          lastActivityUpdateRef.current = Date.now();
          void updateHeartbeat();
        }, ACTIVITY_DEBOUNCE);
      }
    };

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keypress', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);
}

// Helper function to update the heartbeat
async function updateHeartbeat(): Promise<void> {
  try {
    await updateSessionHeartbeat();
  } catch (error) {
    logger.error('Heartbeat update failed', error);
  }
}
