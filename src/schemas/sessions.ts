import { z } from 'zod';

// -- Session Creation Schemas -----------------------------------------------

export const CreateSessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  sessionToken: z.string().min(1, 'Session token is required'),
  expires: z.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  deviceType: z.string().optional().nullable(),
  deviceVendor: z.string().optional().nullable(),
  deviceModel: z.string().optional().nullable(),
  osName: z.string().optional().nullable(),
  osVersion: z.string().optional().nullable(),
  browserName: z.string().optional().nullable(),
  browserVersion: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  deviceName: z.string().optional().nullable(),
  lastActiveAt: z.date().optional(),
});

// -- Session Management Schemas ---------------------------------------------

export const DeleteSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const DeleteSessionsSchema = z.object({
  sessionIds: z.array(z.string()).min(1, 'Select at least one session'),
});

export const DeleteOtherSessionsSchema = z.object({
  currentSessionId: z.string().min(1, 'Current session ID is required'),
});

export const UpdateSessionNameSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  deviceName: z.string().min(1, 'Device name is required'),
});

export const ExtendSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// -- Type Exports -----------------------------------------------------------

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type DeleteSessionInput = z.infer<typeof DeleteSessionSchema>;
export type DeleteSessionsInput = z.infer<typeof DeleteSessionsSchema>;
export type DeleteOtherSessionsInput = z.infer<typeof DeleteOtherSessionsSchema>;
export type UpdateSessionNameInput = z.infer<typeof UpdateSessionNameSchema>;
export type ExtendSessionInput = z.infer<typeof ExtendSessionSchema>;
