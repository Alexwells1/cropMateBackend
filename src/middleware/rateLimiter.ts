import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { ApiResponse } from '../types';

const rateLimitResponse = (message: string) => ({
  success: false,
  message,
} as ApiResponse);

/** General API rate limiter */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse('Too many requests from this IP. Please wait and try again.')
    );
  },
});

/** Stricter limiter for auth endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse('Too many login attempts. Please try again in 15 minutes.')
    );
  },
});

/** Very tight limiter for AI detection (expensive endpoint) */
export const detectionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse('Detection limit reached. Please wait before scanning again.')
    );
  },
});
