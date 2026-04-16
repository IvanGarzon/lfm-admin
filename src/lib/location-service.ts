/**
 * Location Service - Non-blocking IP geolocation
 *
 * This service fetches location data WITHOUT blocking sign-in.
 * Location is updated in the background after session is created.
 */

import type { LocationData } from '@/features/sessions/types';
import { logger } from '@/lib/logger';

/**
 * Fetch location from IP address (non-blocking)
 * This should be called AFTER sign-in, not during
 */
export async function getLocationFromIP(ip: string): Promise<LocationData> {
  if (!ip || isLocalhost(ip)) {
    return {
      country: 'localhost',
      region: '',
      city: '',
      timezone: '',
      latitude: 0,
      longitude: 0,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn('IP lookup failed', {
        context: 'getLocationFromIP',
        metadata: { status: res.status, ip },
      });
      return {};
    }

    const data = await res.json();

    return {
      country: data.country_name || data.country,
      region: data.region,
      city: data.city,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('IP lookup timed out', {
        context: 'getLocationFromIP',
        metadata: { ip },
      });
    } else {
      logger.error('IP lookup failed', error, {
        context: 'getLocationFromIP',
        metadata: { ip },
      });
    }
    return {};
  }
}

/**
 * Update session with location data (call this in background)
 * Uses SessionRepository to avoid direct Prisma usage
 */
export async function updateSessionLocation(sessionToken: string, ip: string): Promise<void> {
  try {
    const location = await getLocationFromIP(ip);

    if (Object.keys(location).length > 0) {
      const { prisma } = await import('@/lib/prisma');
      const { SessionRepository } = await import('@/repositories/session-repository');

      const sessionRepo = new SessionRepository(prisma);
      const updatedSession = await sessionRepo.updateSessionLocation(sessionToken, location);

      if (updatedSession) {
        logger.info('Session location updated', {
          context: 'updateSessionLocation',
          metadata: {
            sessionToken,
            ...location,
          },
        });
      } else {
        logger.warn('Session not found for location update', {
          context: 'updateSessionLocation',
          metadata: { sessionToken },
        });
      }
    }
  } catch (error) {
    logger.error('Failed to update session location', error, {
      context: 'updateSessionLocation',
      metadata: { sessionToken, ip },
    });
  }
}

function isLocalhost(ip: string): boolean {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  );
}
