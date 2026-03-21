import { Request, Response, NextFunction } from 'express';
import * as detectionService from '../service/diseaseDetection.service';
import { sendCreated, sendSuccess, sendError } from '../../../utils/response';
import { DiseaseDetectionModel } from '../repository/diseaseDetection.model';
import { IDiseaseDetection } from '../../../types';

export async function detectDisease(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'A crop image file is required. Send as multipart/form-data with field name "image".', 400);
      return;
    }

    const cropId = req.body['cropId'] as string | undefined;
    if (!cropId || cropId.trim() === '') {
      sendError(res, 'cropId is required in the request body.', 400);
      return;
    }

    const detection = await detectionService.runDiseaseDetection(
      cropId.trim(),
      req.user!.userId,
      req.file.buffer
    );

    sendCreated(res, 'Disease detection completed.', {
      detectionId: detection._id,
      disease: detection.detectedDisease,
      confidence: `${Math.round(detection.confidenceScore * 100)}%`,
      isHealthy: detection.isHealthy,
      severity: detection.severity,
      treatment: detection.treatment,
      preventionAdvice: detection.preventionAdvice,
      imageUrl: detection.imageUrl,
      detectedAt: detection.detectedAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDetectionById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const detection = await DiseaseDetectionModel.findById(req.params.id).lean<IDiseaseDetection>();
    if (!detection) {
      sendError(res, 'Detection not found.', 404);
      return;
    }
    sendSuccess(res, 'Detection retrieved.', detection);
  } catch (err) {
    next(err);
  }
}

export async function getDetectionsByFarm(
  req: Request<{ farmId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const detections = await detectionService.getDetectionsByFarm(
      req.params.farmId,
      req.user!.userId
    );
    sendSuccess(res, 'Detections retrieved.', detections);
  } catch (err) {
    next(err);
  }
}

export async function getDetectionsByCrop(
  req: Request<{ cropId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const detections = await detectionService.getDetectionsByCrop(
      req.params.cropId,
      req.user!.userId
    );
    sendSuccess(res, 'Detections retrieved.', detections);
  } catch (err) {
    next(err);
  }
}
