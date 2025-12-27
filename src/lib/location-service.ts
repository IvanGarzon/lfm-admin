/**
 * Location Service - Non-blocking IP geolocation
 *
 * This service fetches location data WITHOUT blocking sign-in.
 * Location is updated in the background after session is created.
 */

export interface LocationData {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

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
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('IP lookup failed:', res.status);
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
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn('IP lookup timed out');
    } else {
      console.error('IP lookup failed:', e);
    }
    return {};
  }
}

/**
 * Update session with location data (call this in background)
 */
export async function updateSessionLocation(sessionToken: string, ip: string): Promise<void> {
  try {
    const location = await getLocationFromIP(ip);

    if (Object.keys(location).length > 0) {
      // Import prisma dynamically to avoid circular deps
      const { prisma } = await import('@/lib/prisma');

      await prisma.session.update({
        where: { sessionToken },
        data: location,
      });

      console.log('Session location updated:', { sessionToken, ...location });
    }
  } catch (error) {
    console.error('Failed to update session location:', error);
    // Don't throw - this is background work
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
