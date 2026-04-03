
import { Request, Response, NextFunction } from 'express';
import * as detectionService from '../service/diseaseDetection.service';
import { sendCreated, sendSuccess, sendError } from '../../../utils/response';
import { DiseaseDetectionModel } from '../repository/diseaseDetection.model';
import { IDiseaseDetection } from '../../../types';

export async function detectDisease(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      sendError(
        res,
        'A crop image file is required. Send as multipart/form-data with field name "image".',
        400,
      );
      return;
    }

    const cropId = req.body['cropId'] as string | undefined;
    if (!cropId || cropId.trim() === '') {
      sendError(res, 'cropId is required in the request body.', 400);
      return;
    }

    // Sanitise clientId — only pass it through when it is a non-empty string.
    // null / '' / undefined all become undefined here so the service never
    // stores null in the clientId field (which would break the sparse index).
    const rawClientId = req.body['clientId'] as string | undefined | null;
    const clientId    = rawClientId?.trim() || undefined;

    const detection = await detectionService.runDiseaseDetection(
      cropId.trim(),
      req.user!.userId,
      req.file.buffer,
      clientId,
    );

    sendCreated(res, 'Disease detection completed.', detection);
  } catch (err) {
    next(err);
  }
}

export async function getDetectionById(
  req:  Request<{ id: string }>,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    const detection = await DiseaseDetectionModel
      .findById(req.params.id)
      .lean<IDiseaseDetection>();

    if (!detection) {
      sendError(res, 'Detection not found.', 404);
      return;
    }

    const { serializeDetection } = await import('../service/diseaseDetection.service');
    sendSuccess(res, 'Detection retrieved.', serializeDetection(detection));
  } catch (err) {
    next(err);
  }
}

export async function getDetectionsByFarm(
  req:  Request<{ farmId: string }>,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    const detections = await detectionService.getDetectionsByFarm(
      req.params.farmId,
      req.user!.userId,
    );
    sendSuccess(res, 'Detections retrieved.', detections);
  } catch (err) {
    next(err);
  }
}

export async function getDetectionsByCrop(
  req:  Request<{ cropId: string }>,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    const detections = await detectionService.getDetectionsByCrop(
      req.params.cropId,
      req.user!.userId,
    );
    sendSuccess(res, 'Detections retrieved.', detections);
  } catch (err) {
    next(err);
  }
}