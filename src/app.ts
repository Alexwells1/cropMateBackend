// ============================================================
// CropMate - Express Application
//
// Phase 5 fix — logging:
//   Removed the response body monkey-patching middleware that was
//   logging every response body (including AI detection results,
//   full farm lists, etc.) to stdout. That pattern:
//     1. Leaked sensitive data in production logs
//     2. Logged raw credentials and detection results
//     3. Intercepted every res.json() call adding latency
//     4. Was a debugging artifact left in production code
//
//   Replaced with structured request/response timing using a
//   single middleware that logs: method, route, status, duration.
//   Full body logging is opt-in and dev-only via LOG_BODY=true env.
//
// Route-level rate limiters added:
//   syncReadLimiter applied to GET /farms, GET /crops, GET /alerts,
//   GET /notifications — allows higher burst for pull-sync reads.
// ============================================================

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { rateLimiter, syncReadLimiter } from './middleware/rateLimiter';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './infrastructure/logger';

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from './modules/auth/routes/auth.routes';
import farmRoutes from './modules/farm/routes/farm.routes';
import cropRoutes from './modules/crop/routes/crop.routes';
import cropRecordRoutes from './modules/cropRecord/routes/cropRecord.routes';
import diseaseDetectionRoutes from './modules/diseaseDetection/routes/diseaseDetection.routes';
import soilRoutes from './modules/soil/routes/soil.routes';
import alertRoutes from './modules/alert/routes/alert.routes';
import rotationRoutes from './modules/rotation/routes/rotation.routes';
import notificationRoutes from './modules/notification/routes/notification.routes';

export function createApp(): Application {
  const app = express();

  // ── CORS ─────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Idempotency-Key'],
      credentials: true,
      optionsSuccessStatus: 200,
      preflightContinue: false,
    })
  );

  // ── Security ─────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── Body parsers ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // ── Structured request logging ────────────────────────────────────────
  // Logs: timestamp, method, path, status, duration.
  // Never logs request or response bodies in production.
  // Set LOG_BODY=true in .env to enable body logging in development only.
  if (!config.server.isTest) {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logLine = `${req.method} ${req.path} ${res.statusCode} +${duration}ms`;

        if (res.statusCode >= 500) {
          logger.error(logLine);
        } else if (res.statusCode >= 400) {
          logger.warn(logLine);
        } else {
          logger.http(logLine);
        }

        // Dev-only body logging — gated by explicit env flag
        if (
          process.env['LOG_BODY'] === 'true' &&
          config.server.isDevelopment &&
          req.body &&
          Object.keys(req.body).length > 0
        ) {
          // Redact sensitive fields before logging
          const safeBody = { ...req.body };
          if (safeBody.password) safeBody.password = '[REDACTED]';
          if (safeBody.passwordHash) safeBody.passwordHash = '[REDACTED]';
          logger.debug(`  Body: ${JSON.stringify(safeBody)}`);
        }
      });
      next();
    });

    // Morgan for Apache-compatible access log (written to log files)
    app.use(
      morgan('combined', {
        stream: {
          write: (msg: string) => logger.http(msg.trim()),
        },
        skip: (_req, res) => res.statusCode < 400, // only log errors to morgan
      })
    );
  }

  // ── Global rate limiter ───────────────────────────────────────────────
  app.use(rateLimiter);

  // ── Health check ─────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'CropMate API',
      version: config.server.apiVersion,
      environment: config.server.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Routes ────────────────────────────────────────────────────────────
  const base = `/api/${config.server.apiVersion}`;

  app.use(`${base}/auth`, authRoutes);

  // syncReadLimiter applied to read-heavy sync endpoints.
  // These are called in parallel bursts during pullAllData on login
  // and during every 15-min background fetch.
  app.use(`${base}/farms`, syncReadLimiter, farmRoutes);
  app.use(`${base}/crops`, syncReadLimiter, cropRoutes);
  app.use(`${base}/records`, cropRecordRoutes);
  app.use(`${base}/detect-disease`, diseaseDetectionRoutes);
  app.use(`${base}/soil`, soilRoutes);
  app.use(`${base}/alerts`, syncReadLimiter, alertRoutes);
  app.use(`${base}/rotation`, rotationRoutes);
  app.use(`${base}/notifications`, syncReadLimiter, notificationRoutes);

  // ── 404 + global error handler ───────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}