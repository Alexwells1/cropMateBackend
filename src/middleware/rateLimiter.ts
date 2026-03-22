import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { ApiResponse } from '../types';

const rateLimitResponse = (message: string): ApiResponse => ({
  success: false,
  message,
});

// Key by authenticated userId when available; fall back to IP.
// Prevents shared-NAT collisions for authenticated requests.
function userOrIpKey(req: Request): string {
  return req.user?.userId ?? req.ip ?? 'unknown';
}

const sharedOptions: Partial<Options> = {
  standardHeaders: true,   // Retry-After header tells client when to retry
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
};

// ── General API limiter ──────────────────────────────────────
// Applied globally. Raised from 100 → 300 per window.
// Enough for any realistic sync burst (bulk farms + crops + records).
export const rateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse(
        'Too many requests. Your app will retry automatically.'
      )
    );
  },
});

// ── Sync read limiter ────────────────────────────────────────
// Applied to read-only data sync endpoints: GET /farms, GET /crops/*,
// GET /alerts, GET /notifications. Higher ceiling because these are
// called in parallel bursts on every login and 15-min background fetch.
export const syncReadLimiter = rateLimit({
  ...sharedOptions,
  windowMs: config.rateLimit.windowMs,
  max: 500,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse(
        'Sync read limit reached. The app will retry automatically.'
      )
    );
  },
});

// ── Auth limiter ─────────────────────────────────────────────
// Unchanged: 10 login/register attempts per 15 minutes per IP.
// Still IP-based here (userId is not yet known at login time).
export const authRateLimiter = rateLimit({
  ...sharedOptions,
  keyGenerator: (req: Request) => req.ip ?? 'unknown', // IP-based for auth
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse(
        'Too many login attempts. Please try again in 15 minutes.'
      )
    );
  },
});

// ── Detection limiter ────────────────────────────────────────
// Raised from 10 → 20 per minute.
// The frontend backoff (30s → 2min → 8min) means even 20 queued
// offline scans will spread out — they won't all hit within the
// same minute. This limit controls abuse of the Cloudinary + AI
// pipeline, not normal sync behavior.
export const detectionRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  max: 20,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      rateLimitResponse(
        'Scan rate limit reached. Your offline scans will sync automatically — please wait a moment.'
      )
    );
  },
});