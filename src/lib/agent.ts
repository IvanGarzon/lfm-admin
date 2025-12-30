import { UAParser } from 'ua-parser-js';
import { env } from 'env';

export interface SessionDeviceLocation {
  ipAddress?: string;
  userAgent?: string;
  device?: Partial<UAParser.IDevice>; // Includes vendor, model, type (console, mobile, tablet, smarttv, wearable, embedded)
  os?: Partial<UAParser.IOS>;
  browser?: Partial<UAParser.IBrowser>;
  // Location details
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

const FAKE_LOCATIONS: Record<string, SessionDeviceLocation> = {
  '103.1.206.0': {
    country: 'Australia',
    region: 'New South Wales',
    city: 'Sydney',
    timezone: 'Australia/Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
  },
  '8.8.8.8': {
    country: 'United States',
    region: 'California',
    city: 'Mountain View',
    timezone: 'America/Los_Angeles',
    latitude: 37.386,
    longitude: -122.0838,
  },
  '81.2.69.160': {
    country: 'United Kingdom',
    region: 'England',
    city: 'London',
    timezone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  '133.130.91.218': {
    country: 'Japan',
    region: 'Tokyo',
    city: 'Tokyo',
    timezone: 'Asia/Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  '49.207.182.118': {
    country: 'India',
    region: 'Karnataka',
    city: 'Bangalore',
    timezone: 'Asia/Kolkata',
    latitude: 12.9716,
    longitude: 77.5946,
  },
};

export async function getClientDetails(): Promise<SessionDeviceLocation> {
  try {
    // Dynamically import next/headers only when needed and available
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');

    return await getDetailsFromUserAgent(userAgent);
  } catch (error) {
    // If next/headers is not available (e.g., in pages router context),
    // return minimal details
    console.warn('next/headers not available, returning minimal client details');
    return await getDetailsFromUserAgent(null);
  }
}

async function getDetailsFromUserAgent(userAgent: string | null): Promise<SessionDeviceLocation> {
  const { deviceType, deviceVendor, deviceModel, osName, osVersion, browserName, browserVersion } =
    getUserAgentDetails(userAgent);

  // For now, use a simple IP approach since we can't reliably get headers
  const isDev = env.NODE_ENV === 'development';
  const ipAddress = isDev ? getRandomFakeIP() : undefined;

  // 🚀 PERFORMANCE FIX: Don't block sign-in waiting for external location API
  // This removes 500-3000ms from every sign-in
  const location = isDev && ipAddress ? FAKE_LOCATIONS[ipAddress] || {} : {};

  return {
    ipAddress,
    userAgent: userAgent ?? undefined,
    device: {
      vendor: deviceVendor,
      model: deviceModel,
      type: deviceType,
    },
    os: {
      name: osName,
      version: osVersion,
    },
    browser: {
      name: browserName,
      version: browserVersion,
    },
    ...location,
  };
}

function getRandomFakeIP() {
  const devIPs = Object.keys(FAKE_LOCATIONS);
  const index = Math.floor(Math.random() * devIPs.length);
  return devIPs[index];
}

function getUserAgentDetails(userAgent: string | null) {
  if (!userAgent) return {};

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  return {
    deviceType: uaResult.device.type,
    deviceVendor: uaResult.device.vendor,
    deviceModel: uaResult.device.model,
    osName: uaResult.os.name,
    osVersion: uaResult.os.version,
    browserName: uaResult.browser.name,
    browserVersion: uaResult.browser.version,
  };
}

// 🚀 REMOVED: getLocationFromIP() function
// This was causing 500-3000ms blocking delay on every sign-in
// by making external API calls to ipapi.co
// Location data can be fetched later if needed via background job
