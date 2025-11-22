import { UAParser } from 'ua-parser-js';
import { env } from 'env';

export interface SessionDeviceLocation {
  ipAddress?: string;
  userAgent?: string;
  device?: UAParser.IDevice; // Includes vendor, model, type (console, mobile, tablet, smarttv, wearable, embedded)
  os?: UAParser.IOS;
  browser?: UAParser.IBrowser;
}

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
  const ipAddress = env.NODE_ENV === 'development' ? getRandomFakeIP() : undefined;

  // Extract location details from IP
  const { country, region, city, latitude, longitude } = await getLocationFromIP(ipAddress);

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
  };
}

function getRandomFakeIP() {
  const devIPs = [
    '103.1.206.0', // Australia
    '8.8.8.8', // US
    '81.2.69.160', // UK
    '133.130.91.218', // Japan
    '49.207.182.118', // India
  ];

  const index = Math.floor(Math.random() * devIPs.length);
  return devIPs[index];
}

function isLocalhost(ip: string | undefined): boolean {
  return (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  );
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

async function getLocationFromIP(ip: string | undefined) {
  if (!ip) return {};

  if (isLocalhost(ip)) {
    return {
      country: 'localhost',
      region: '',
      city: '',
      latitude: 0,
      longitude: 0,
    };
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return {};
    const data = await res.json();

    return {
      country: data.country,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (e) {
    console.error('IP lookup failed:', e);
    return {};
  }
}
