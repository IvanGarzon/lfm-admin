import { IconType } from 'react-icons';
import {
  FaWindows,
  FaApple,
  FaLinux,
  FaChrome,
  FaSafari,
  FaFirefoxBrowser,
  FaAndroid,
  FaEdge,
  FaGlobe,
  FaShieldAlt,
} from 'react-icons/fa';

import {
  HiOutlineDevicePhoneMobile,
  HiOutlineDeviceTablet,
} from 'react-icons/hi2';

import { MdMonitor, MdLaptop } from 'react-icons/md';

/**
 * Returns the appropriate device icon based on the device type.
 * 
 * @param deviceType - The device type string (e.g., "mobile", "tablet", "desktop")
 * @returns React icon component for the device type
 * 
 * @example
 * ```tsx
 * const Icon = getDeviceIcon("mobile");
 * return <Icon className="w-6 h-6" />;
 * ```
 */
export function getDeviceIcon(deviceType?: string | null): IconType {
  if (!deviceType) return MdMonitor;

  const type = deviceType.toLowerCase();

  if (type.includes('mobile') || type.includes('phone')) {
    return HiOutlineDevicePhoneMobile;
  }

  if (type.includes('tablet')) {
    return HiOutlineDeviceTablet;
  }

  if (type.includes('desktop')) {
    return MdMonitor;
  }

  // Default to laptop for unknown types
  return MdLaptop;
}

/**
 * Returns the appropriate operating system icon.
 * 
 * @param osName - The OS name string (e.g., "Windows", "macOS", "Linux", "iOS", "Android")
 * @returns React icon component for the operating system
 * 
 * @example
 * ```tsx
 * const Icon = getOSIcon("macOS");
 * return <Icon className="w-4 h-4" />;
 * ```
 */
export function getOSIcon(osName?: string | null): IconType {
  if (!osName) return MdMonitor;

  const os = osName.toLowerCase();

  if (os.includes('mac') || os.includes('darwin') || os.includes('ios')) {
    return FaApple; // Apple icon for macOS and iOS
  }

  if (os.includes('windows')) {
    return FaWindows; // Windows icon
  }

  if (os.includes('linux')) {
    return FaLinux; // Linux icon
  }

  if (os.includes('android')) {
    return FaAndroid; // Android icon
  }

  return MdMonitor;
}

/**
 * Returns the appropriate browser icon.
 * 
 * @param browserName - The browser name string (e.g., "Chrome", "Firefox", "Safari", "Edge", "Brave")
 * @returns React icon component for the browser
 * 
 * @example
 * ```tsx
 * const Icon = getBrowserIcon("Chrome");
 * return <Icon className="w-4 h-4" />;
 * ```
 */
export function getBrowserIcon(browserName?: string | null): IconType {
  if (!browserName) return FaGlobe;

  const browser = browserName.toLowerCase();

  if (browser.includes('chrome') && !browser.includes('edge')) {
    return FaChrome;
  }

  if (browser.includes('firefox')) {
    return FaFirefoxBrowser;
  }

  if (browser.includes('safari')) {
    return FaSafari;
  }

  if (browser.includes('edge')) {
    return FaEdge;
  }

  if (browser.includes('brave')) {
    return FaShieldAlt; // Brave uses Shield
  }

  return FaGlobe; // Default to Globe for unknown browsers
}

/**
 * Returns OS display information including icon, label, and styling colors.
 * 
 * @param osName - The OS name string
 * @returns Object containing Icon component, label, text color, and background color classes
 * 
 * @example
 * ```tsx
 * const { Icon, label, color, bgColor } = getOSDisplay("macOS");
 * return (
 *   <Badge className={`${bgColor} ${color}`}>
 *     <Icon className="w-3 h-3" />
 *     <span>{label}</span>
 *   </Badge>
 * );
 * ```
 */
export function getOSDisplay(osName?: string | null): {
  Icon: IconType;
  label: string;
  color: string;
  bgColor: string;
} {
  if (!osName) {
    return {
      Icon: MdMonitor,
      label: 'Unknown OS',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  }

  const os = osName.toLowerCase();

  if (os.includes('windows')) {
    return {
      Icon: FaWindows,
      label: 'Windows',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  if (os.includes('mac') || os.includes('darwin')) {
    return {
      Icon: FaApple,
      label: 'macOS',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    };
  }

  if (os.includes('linux')) {
    return {
      Icon: FaLinux,
      label: 'Linux',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    };
  }

  if (os.includes('ios')) {
    return {
      Icon: FaApple,
      label: 'iOS',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    };
  }

  if (os.includes('android')) {
    return {
      Icon: FaAndroid,
      label: 'Android',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  }

  return {
    Icon: MdMonitor,
    label: osName,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

/**
 * Returns browser display information including icon, label, and styling colors.
 * 
 * @param browserName - The browser name string
 * @returns Object containing Icon component, label, text color, and background color classes
 * 
 * @example
 * ```tsx
 * const { Icon, label, color, bgColor } = getBrowserDisplay("Chrome");
 * return (
 *   <Badge className={`${bgColor} ${color}`}>
 *     <Icon className="w-3 h-3" />
 *     <span>{label}</span>
 *   </Badge>
 * );
 * ```
 */
export function getBrowserDisplay(browserName?: string | null): {
  Icon: IconType;
  label: string;
  color: string;
  bgColor: string;
} {
  if (!browserName) {
    return {
      Icon: FaGlobe,
      label: 'Unknown',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  }

  const browser = browserName.toLowerCase();

  if (browser.includes('chrome') && !browser.includes('edge')) {
    return {
      Icon: FaChrome,
      label: 'Chrome',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    };
  }

  if (browser.includes('firefox')) {
    return {
      Icon: FaFirefoxBrowser,
      label: 'Firefox',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    };
  }

  if (browser.includes('safari')) {
    return {
      Icon: FaSafari,
      label: 'Safari',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  if (browser.includes('edge')) {
    return {
      Icon: FaEdge,
      label: 'Edge',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    };
  }

  if (browser.includes('brave')) {
    return {
      Icon: FaShieldAlt,
      label: 'Brave',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    };
  }

  return {
    Icon: FaGlobe,
    label: browserName,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

/**
 * Returns device type display information including icon, label, and styling colors.
 * 
 * @param deviceType - The device type string
 * @returns Object containing Icon component, label, text color, and background color classes
 * 
 * @example
 * ```tsx
 * const { Icon, label, color, bgColor } = getDeviceTypeDisplay("mobile");
 * return (
 *   <div className={`${bgColor} p-2 rounded`}>
 *     <Icon className={`${color} w-6 h-6`} />
 *   </div>
 * );
 * ```
 */
export function getDeviceTypeDisplay(deviceType?: string | null): {
  Icon: IconType;
  label: string;
  color: string;
  bgColor: string;
} {
  if (!deviceType) {
    return {
      Icon: MdMonitor,
      label: 'Unknown',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  }

  const type = deviceType.toLowerCase();

  if (type.includes('mobile') || type.includes('phone')) {
    return {
      Icon: HiOutlineDevicePhoneMobile,
      label: 'Mobile',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  if (type.includes('tablet')) {
    return {
      Icon: HiOutlineDeviceTablet,
      label: 'Tablet',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    };
  }

  if (type.includes('desktop')) {
    return {
      Icon: MdMonitor,
      label: 'Desktop',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  }

  return {
    Icon: MdLaptop,
    label: deviceType,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

/**
 * Generates a human-readable session name from device information.
 * Combines OS, browser, and device type into a descriptive string.
 * 
 * @param osName - The operating system name
 * @param browserName - The browser name
 * @param deviceType - The device type
 * @returns A formatted session name string (e.g., "Mac Chrome - Web Browser")
 * 
 * @example
 * ```tsx
 * const sessionName = generateSessionName("macOS", "Chrome", "desktop");
 * // Returns: "Mac Chrome - Web Browser"
 * ```
 */
export function generateSessionName(
  osName?: string | null,
  browserName?: string | null,
  deviceType?: string | null
): string {
  // Get OS display name
  let os = 'Unknown';
  if (osName) {
    const osLower = osName.toLowerCase();
    if (osLower.includes('mac') || osLower.includes('darwin')) {
      os = 'Mac';
    } else if (osLower.includes('ios')) {
      os = 'iPhone';
    } else if (osLower.includes('windows')) {
      os = 'Windows';
    } else if (osLower.includes('android')) {
      os = 'Android';
    } else if (osLower.includes('linux')) {
      os = 'Linux';
    } else {
      os = osName;
    }
  }

  // Get browser display name
  let browser = 'Browser';
  if (browserName) {
    const browserLower = browserName.toLowerCase();
    if (browserLower.includes('chrome') && !browserLower.includes('edge')) {
      browser = 'Chrome';
    } else if (browserLower.includes('firefox')) {
      browser = 'Firefox';
    } else if (browserLower.includes('safari')) {
      browser = 'Safari';
    } else if (browserLower.includes('edge')) {
      browser = 'Edge';
    } else if (browserLower.includes('brave')) {
      browser = 'Brave';
    } else {
      browser = browserName;
    }
  }

  // Get device type suffix
  let deviceSuffix = 'Web Browser';
  if (deviceType) {
    const typeLower = deviceType.toLowerCase();
    if (typeLower.includes('mobile') || typeLower.includes('phone')) {
      deviceSuffix = 'Mobile Browser';
    } else if (typeLower.includes('tablet')) {
      deviceSuffix = 'Tablet Browser';
    } else {
      deviceSuffix = 'Web Browser'; // Desktop/Laptop
    }
  }

  return `${os} ${browser} - ${deviceSuffix}`;
}
