'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { updateSessionHeartbeat } from '@/actions/sessions/mutations';

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const ACTIVITY_DEBOUNCE = 30 * 1000; // 30 seconds - minimum time between activity-triggered updates

/**
 * Hook to periodically update the session's lastActiveAt timestamp
 * This replaces the middleware approach which had issues with Edge Runtime
 */
export function useSessionHeartbeat() {
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityUpdateRef = useRef<number>(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run for authenticated users
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    // Update immediately on mount
    void updateHeartbeat();

    // Then update every minute
    intervalRef.current = setInterval(() => {
      void updateHeartbeat();
    }, HEARTBEAT_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, session]);

  // Also update on user activity (debounced)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const handleActivity = () => {
      const now = Date.now();

      // Clear any pending activity timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Only update if enough time has passed since last activity update
      if (now - lastActivityUpdateRef.current >= ACTIVITY_DEBOUNCE) {
        lastActivityUpdateRef.current = now;
        void updateHeartbeat();
      } else {
        // Schedule an update for later if user keeps being active
        activityTimeoutRef.current = setTimeout(() => {
          lastActivityUpdateRef.current = Date.now();
          void updateHeartbeat();
        }, ACTIVITY_DEBOUNCE);
      }
    };

    // Update on various user activities
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keypress', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [status, session]);
}

// Helper function to update the heartbeat
async function updateHeartbeat() {
  try {
    await updateSessionHeartbeat();
  } catch (error) {
    // Silently fail - this is not critical
    console.debug('Heartbeat update failed:', error);
  }
}
