// ============================================================
// CropMate - Crop Controller
//
// Change: passes clientId from request body to createCrop service
// so idempotent retry is supported for CROP_CREATE actions.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import * as cropService from '../service/crop.service';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { CreateCropInput, UpdateCropInput } from '../../../validations';

export async function createCrop(
  req: Request<Record<string, never>, unknown, CreateCropInput & { clientId?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crop = await cropService.createCrop(req.user!.userId, req.body);
    sendCreated(res, 'Crop added successfully.', crop);
  } catch (err) {
    next(err);
  }
}

export async function getCropsByFarm(
  req: Request<{ farmId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crops = await cropService.getCropsByFarm(req.params.farmId, req.user!.userId);
    sendSuccess(res, 'Crops retrieved.', crops);
  } catch (err) {
    next(err);
  }
}

export async function updateCrop(
  req: Request<{ id: string }, unknown, UpdateCropInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crop = await cropService.updateCrop(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, 'Crop updated.', crop);
  } catch (err) {
    next(err);
  }
}

export async function getAllCrops(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crops = await cropService.getAllCropsByUser(req.user!.userId);
    sendSuccess(res, 'All crops retrieved.', crops);
  } catch (err) {
    next(err);
  }
}