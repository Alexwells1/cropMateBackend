import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Require an env variable — throws at startup if missing.
 * This ensures the server never runs with incomplete config.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
        `Check your .env file against .env.example.`
    );
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

function optionalEnvOrUndefined(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

const isTest = optionalEnv('NODE_ENV', 'development') === 'test';

export const config = {
  server: {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    apiVersion: optionalEnv('API_VERSION', 'v1'),
    get isProduction() {
      return this.nodeEnv === 'production';
    },
    get isDevelopment() {
      return this.nodeEnv === 'development';
    },
    get isTest() {
      return this.nodeEnv === 'test';
    },
  },

  database: {
    mongoUri: isTest
      ? optionalEnv('MONGODB_URI_TEST', 'mongodb://localhost:27017/cropmate_test')
      : requireEnv('MONGODB_URI'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  cloudinary: {
    cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: requireEnv('CLOUDINARY_API_KEY'),
    apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  },

  ai: {
    serviceUrl: requireEnv('AI_SERVICE_URL'),
    apiKey: requireEnv('AI_SERVICE_API_KEY'),
    timeoutMs: parseInt(optionalEnv('AI_SERVICE_TIMEOUT_MS', '30000'), 10),
  },

  openWeather: {
    apiUrl: optionalEnv(
      'OPENWEATHER_API_URL',
      'https://api.openweathermap.org/data/2.5'
    ),
    apiKey: requireEnv('OPENWEATHER_API_KEY'),
  },

  isda: {
    apiUrl: optionalEnv('ISDA_SOIL_API_URL', 'https://api.isda-africa.com/v1'),
    apiKey: requireEnv('ISDA_SOIL_API_KEY'),
  },

  redis: {
    host: optionalEnv('REDIS_HOST', '127.0.0.1'),
    port: parseInt(optionalEnv('REDIS_PORT', '6379'), 10),
    password: optionalEnvOrUndefined('REDIS_PASSWORD'),
    ttlSeconds: parseInt(optionalEnv('REDIS_TTL_SECONDS', '3600'), 10),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    authMax: parseInt(optionalEnv('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },

  cors: {
    allowedOrigins: optionalEnv(
      'CORS_ALLOWED_ORIGINS',
      'http://localhost:3000'
    ).split(',').map((o) => o.trim()),
  },

  logger: {
    level: optionalEnv('LOG_LEVEL', 'debug'),
    dir: optionalEnv('LOG_DIR', 'logs'),
  },

  alerts: {
    radiusKm: parseFloat(optionalEnv('ALERT_RADIUS_KM', '10')),
  },
} as const;

export type AppConfig = typeof config;
