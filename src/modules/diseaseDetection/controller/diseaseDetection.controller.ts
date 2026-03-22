// ============================================================
// CropMate - DiseaseDetection Controller
//
// Phase 2 fix — response shape consistency:
//   detectDisease now returns the FULL detection object with all
//   fields the frontend needs for offline storage:
//     _id, cropId, farmId, userId, imageUrl, detectedDisease,
//     confidenceScore (number 0-1), severity, isHealthy,
//     treatment, preventionAdvice, detectedAt, createdAt, updatedAt
//
//   Previously the controller returned a custom DTO that:
//     - Used 'detectionId' instead of '_id' (breaking upsertDetections)
//     - Returned confidence as string "91%" instead of number 0.91
//     - Omitted cropId, farmId, createdAt, updatedAt
//
//   The frontend disease.service.ts normalised the old shape.
//   After this fix the frontend service no longer needs that workaround —
//   it receives a shape that directly matches IDiseaseDetection.
//
//   NOTE: The frontend disease.service.ts is updated in Phase 7 to
//   consume the new shape directly.
// ============================================================

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
      sendError(
        res,
        'A crop image file is required. Send as multipart/form-data with field name "image".',
        400
      );
      return;
    }

    const cropId = req.body['cropId'] as string | undefined;
    if (!cropId || cropId.trim() === '') {
      sendError(res, 'cropId is required in the request body.', 400);
      return;
    }

    // clientId is the frontend's localDetectionId — used for idempotency
    const clientId = req.body['clientId'] as string | undefined;

    const detection = await detectionService.runDiseaseDetection(
      cropId.trim(),
      req.user!.userId,
      req.file.buffer,
      clientId?.trim()
    );

    // Phase 2: return the full detection object.
    // The frontend's upsertDetections() needs every field present.
    // confidenceScore remains a number (0-1) — the frontend formats
    // it as a percentage for display.
    sendCreated(res, 'Disease detection completed.', detection);
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
    // Serialize before sending so timestamps are ISO strings
    const { serializeDetection } = await import('../service/diseaseDetection.service');
    sendSuccess(res, 'Detection retrieved.', serializeDetection(detection));
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