import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import * as detectionController from '../controller/diseaseDetection.controller';
import { authenticate } from '../../../middleware/authenticate';
import { detectionRateLimiter } from '../../../middleware/rateLimiter';
import { sendError } from '../../../utils/response';
import { getDetectionById } from '../controller/diseaseDetection.controller';

// ── Multer config — store in memory, send buffer to Cloudinary ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

function handleMulterError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'Image must be smaller than 10MB.', 400);
      return;
    }
    sendError(res, err.message, 400);
    return;
  }
  if (err.message.includes('Only JPEG')) {
    sendError(res, err.message, 400);
    return;
  }
  next(err);
}

const router = Router();
router.use(authenticate);

// POST /api/v1/detect-disease
router.post(
  '/',
  detectionRateLimiter,
  upload.single('image'),
  handleMulterError,
  detectionController.detectDisease
);

// GET /api/v1/detect-disease/farm/:farmId
router.get('/farm/:farmId', detectionController.getDetectionsByFarm);

// GET /api/v1/detect-disease/crop/:cropId
router.get('/crop/:cropId', detectionController.getDetectionsByCrop);

router.get('/:id', authenticate, getDetectionById);  // GET /detect-disease/:id

export default router;
