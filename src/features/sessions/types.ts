/**
 * Session Types
 * Centralized type definitions for the sessions feature
 */

/**
 * Session with user details
 * This is the main type used throughout the sessions feature
 */
export type SessionWithUser = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;

  // Network information
  ipAddress: string | null;
  userAgent: string | null;

  // Device information
  deviceName: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;

  // Browser and OS information
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;

  // Location information
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;

  // User details (joined from User table)
  user: {
    firstName: string | null;
    lastName: string | null;
  };

  // Feature-specific flag
  isCurrent?: boolean;
};