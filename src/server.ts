import { createApp } from './app';
import { connectDatabase } from './database/connection';
import { connectRedis } from './infrastructure/cache/redis';
import { registerEventListeners } from './events/listeners';
import { config } from './config';
import logger from './infrastructure/logger';
import http from 'http';

let server: http.Server;

async function bootstrap(): Promise<void> {
  // 1 — Connect to MongoDB (mandatory)
  await connectDatabase();

  // 2 — Connect to Redis (optional — non-fatal)
  connectRedis();

  // 3 — Wire internal event listeners
  registerEventListeners();

  // 4 — Create and start Express server
  const app = createApp();

  server = app.listen(config.server.port, () => {
    logger.info('─────────────────────────────────────────────');
    logger.info(`🌱  CropMate API started`);
    logger.info(`    Port        : ${config.server.port}`);
    logger.info(`    Environment : ${config.server.nodeEnv}`);
    logger.info(`    Base URL    : http://localhost:${config.server.port}/api/${config.server.apiVersion}`);
    logger.info(`    Health      : http://localhost:${config.server.port}/health`);
    logger.info('─────────────────────────────────────────────');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${config.server.port} is already in use.`);
    } else {
      logger.error('Server error:', err);
    }
    process.exit(1);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal: string): void {
  logger.info(`\n${signal} received — shutting down gracefully...`);
  server?.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10s if connections do not close
  setTimeout(() => {
    logger.warn('Forcing shutdown after 10s timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  logger.error('Bootstrap failed:', err);
  process.exit(1);
});
