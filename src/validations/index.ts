import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Enter a valid international phone number e.g. +2348012345678'
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(1, 'Phone number is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─────────────────────────────────────────────────────────────────────────────
// FARM
// clientId: optional frontend-generated local ID used for idempotent creates.
// When present the backend uses findOneAndUpdate+upsert to prevent duplicates
// on retry. Max 100 chars covers "local_<timestamp>_<random>" format.
// ─────────────────────────────────────────────────────────────────────────────

export const createFarmSchema = z.object({
  farmName: z
    .string({ required_error: 'Farm name is required' })
    .min(2, 'Farm name must be at least 2 characters')
    .max(150, 'Farm name cannot exceed 150 characters')
    .trim(),
  farmSize: z
    .number({ required_error: 'Farm size is required', invalid_type_error: 'Farm size must be a number' })
    .positive('Farm size must be a positive number'),
  location: z.object(
    {
      latitude: z
        .number({ required_error: 'Latitude is required' })
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
      longitude: z
        .number({ required_error: 'Longitude is required' })
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
    },
    { required_error: 'Location is required' }
  ),
  soilType: z
    .enum(['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky', 'Unknown'], {
      errorMap: () => ({
        message: 'soilType must be one of: Loamy, Sandy, Clay, Silty, Peaty, Chalky, Unknown',
      }),
    })
    .default('Unknown'),
  clientId: z.string().max(100).trim().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CROP
// clientId: same idempotency purpose as farm.
// ─────────────────────────────────────────────────────────────────────────────

export const createCropSchema = z.object({
  farmId: z
    .string({ required_error: 'farmId is required' })
    .min(1, 'farmId cannot be empty'),
  cropName: z
    .string({ required_error: 'Crop name is required' })
    .min(2, 'Crop name must be at least 2 characters')
    .max(100, 'Crop name cannot exceed 100 characters')
    .trim(),
  plantingDate: z
    .string({ required_error: 'Planting date is required' })
    .refine((d) => !isNaN(Date.parse(d)), 'plantingDate must be a valid date string'),
  fieldArea: z
    .number({ required_error: 'Field area is required', invalid_type_error: 'Field area must be a number' })
    .positive('Field area must be positive'),
  status: z
    .enum(['growing', 'harvested', 'failed', 'dormant'])
    .optional()
    .default('growing'),
  expectedHarvestDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), 'expectedHarvestDate must be a valid date')
    .optional(),
  clientId: z.string().max(100).trim().optional(),
});

export const updateCropSchema = z.object({
  cropName: z.string().min(2).max(100).trim().optional(),
  status: z.enum(['growing', 'harvested', 'failed', 'dormant']).optional(),
  expectedHarvestDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid date')
    .optional(),
  fieldArea: z.number().positive().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CROP RECORD
// clientId: idempotency key for RECORD_LOG retry safety.
// ─────────────────────────────────────────────────────────────────────────────

export const logActivitySchema = z.object({
  cropId: z
    .string({ required_error: 'cropId is required' })
    .min(1, 'cropId cannot be empty'),
  activityType: z.enum(
    ['fertilizer', 'irrigation', 'pesticide', 'harvest', 'planting', 'weeding', 'other'],
    { errorMap: () => ({ message: 'Invalid activity type' }) }
  ),
  description: z
    .string({ required_error: 'Description is required' })
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  quantity: z.string().max(100).trim().optional(),
  activityDate: z
    .string({ required_error: 'Activity date is required' })
    .refine((d) => !isNaN(Date.parse(d)), 'activityDate must be a valid date string'),
  clientId: z.string().max(100).trim().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION (query params)
// ─────────────────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page must be a positive integer')
    .optional()
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'limit must be a positive integer')
    .optional()
    .default('20'),
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RegisterInput     = z.infer<typeof registerSchema>;
export type LoginInput        = z.infer<typeof loginSchema>;
export type CreateFarmInput   = z.infer<typeof createFarmSchema>;
export type CreateCropInput   = z.infer<typeof createCropSchema>;
export type UpdateCropInput   = z.infer<typeof updateCropSchema>;
export type LogActivityInput  = z.infer<typeof logActivitySchema>;
export type PaginationInput   = z.infer<typeof paginationSchema>;