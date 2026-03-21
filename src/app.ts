import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { rateLimiter } from "./middleware/rateLimiter";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";
import logger from "./infrastructure/logger";

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from "./modules/auth/routes/auth.routes";
import farmRoutes from "./modules/farm/routes/farm.routes";
import cropRoutes from "./modules/crop/routes/crop.routes";
import cropRecordRoutes from "./modules/cropRecord/routes/cropRecord.routes";
import diseaseDetectionRoutes from "./modules/diseaseDetection/routes/diseaseDetection.routes";
import soilRoutes from "./modules/soil/routes/soil.routes";
import alertRoutes from "./modules/alert/routes/alert.routes";
import rotationRoutes from "./modules/rotation/routes/rotation.routes";
import notificationRoutes from "./modules/notification/routes/notification.routes";

export function createApp(): Application {
  const app = express();

  // ── CORS - This MUST come before any other middleware ─────────────────────
  // Configure CORS to allow all origins
  app.use(
    cors({
      origin: true, // Allow any origin
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
      credentials: true,
      optionsSuccessStatus: 200,
      preflightContinue: false,
    })
  );

  // Add explicit CORS headers as a backup
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('🔐 Preflight request handled');
      return res.sendStatus(200);
    }
    
    next();
  });

  // ── 🔍 SUPER DETAILED REQUEST LOGGING (Place this AFTER CORS) ─────────────────
  app.use((req, res, next) => {
    console.log("\n" + "=".repeat(80));
    console.log(`🕐 ${new Date().toISOString()}`);
    console.log(`📌 ${req.method} ${req.url}`);
    console.log(`🌐 ORIGIN: "${req.headers.origin || 'No origin'}"`);
    console.log(`📋 HEADERS:`, JSON.stringify({
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : undefined,
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
      'host': req.headers.host,
      'referer': req.headers.referer,
    }, null, 2));
    
    // Log ALL headers for debugging
    console.log(`📋 ALL HEADERS:`, req.headers);
    
    // Capture response
    const oldJson = res.json;
    const oldSend = res.send;
    const oldEnd = res.end;
    
    res.json = function(body) {
      console.log(`📤 RESPONSE ${res.statusCode}:`, body);
      return oldJson.call(this, body);
    };
    
    res.send = function(body) {
      console.log(`📤 RESPONSE ${res.statusCode}:`, body);
      return oldSend.call(this, body);
    };
    
    next();
  });

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
  }));

  // Log CORS response headers after each request
  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`\n🔐 CORS RESPONSE HEADERS:`);
      console.log(`   Access-Control-Allow-Origin: ${res.getHeader('access-control-allow-origin')}`);
      console.log(`   Access-Control-Allow-Credentials: ${res.getHeader('access-control-allow-credentials')}`);
      console.log(`   Access-Control-Allow-Methods: ${res.getHeader('access-control-allow-methods')}`);
      console.log(`   Access-Control-Allow-Headers: ${res.getHeader('access-control-allow-headers')}`);
    });
    next();
  });

  // ── Body parsers ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // ── Log request body for non-file uploads ───────────────────────────────────
  app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 REQUEST BODY:`, req.body);
    }
    next();
  });

  // ── Single morgan logger ───────────────────────────────────────────────────
  if (!config.server.isTest) {
    app.use(
      morgan("dev", {
        stream: { 
          write: (msg: string) => {
            console.log(`📝 MORGAN: ${msg.trim()}`);
            logger.http(msg.trim());
          }
        },
      }),
    );
  }

  // ── Rate limiting (global) ──────────────────────────────────────────────────
  app.use(rateLimiter);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    console.log("❤️ Health check called");
    res.status(200).json({
      success: true,
      service: "CropMate API",
      version: config.server.apiVersion,
      environment: config.server.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Log all registered routes (for debugging) ───────────────────────────────
  const base = `/api/${config.server.apiVersion}`;
  console.log("\n🗺️  REGISTERED ROUTES:");
  console.log(`   Base path: ${base}`);
  console.log(`   Auth: ${base}/auth`);
  console.log(`   Farms: ${base}/farms`);
  console.log(`   Crops: ${base}/crops`);
  console.log(`   Records: ${base}/records`);
  console.log(`   Disease Detection: ${base}/detect-disease`);
  console.log(`   Soil: ${base}/soil`);
  console.log(`   Alerts: ${base}/alerts`);
  console.log(`   Rotation: ${base}/rotation`);
  console.log(`   Notifications: ${base}/notifications`);
  console.log("=".repeat(80) + "\n");

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use(`${base}/auth`, authRoutes);
  app.use(`${base}/farms`, farmRoutes);
  app.use(`${base}/crops`, cropRoutes);
  app.use(`${base}/records`, cropRecordRoutes);
  app.use(`${base}/detect-disease`, diseaseDetectionRoutes);
  app.use(`${base}/soil`, soilRoutes);
  app.use(`${base}/alerts`, alertRoutes);
  app.use(`${base}/rotation`, rotationRoutes);
  app.use(`${base}/notifications`, notificationRoutes);

  // ── 404 handler with logging ────────────────────────────────────────────────
  app.use((req, res, next) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
    next();
  });
  
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}