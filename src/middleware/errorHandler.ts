import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiResponse } from '../types';
import logger from '../infrastructure/logger';

// ── Custom operational error ──────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── 404 handler ───────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  };
  res.status(404).json(response);
}

// ── Global error handler ──────────────────────────────────────────────────────
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });

  // Zod validation
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    } as ApiResponse);
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message } as ApiResponse);
    return;
  }

  // Mongoose duplicate key
  const mongoErr = err as { name?: string; code?: number; keyValue?: Record<string, unknown> };
  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    } as ApiResponse);
    return;
  }

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(422).json({
      success: false,
      message: 'Database validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    } as ApiResponse);
    return;
  }

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: "${err.value}"`,
    } as ApiResponse);
    return;
  }

  // Fallback — hide internals in production
  res.status(500).json({
    success: false,
    message:
      process.env['NODE_ENV'] === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
  } as ApiResponse);
}
