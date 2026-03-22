// ============================================================
// CropMate - Farm Controller
//
// Change: passes clientId from request body to createFarm service
// so idempotent retry is supported for FARM_CREATE actions.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import * as farmService from '../service/farm.service';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { CreateFarmInput } from '../../../validations';

export async function createFarm(
  req: Request<Record<string, never>, unknown, CreateFarmInput & { clientId?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const farm = await farmService.createFarm(req.user!.userId, req.body);
    sendCreated(res, 'Farm created successfully.', farm);
  } catch (err) {
    next(err);
  }
}

export async function getUserFarms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const farms = await farmService.getFarmsByUser(req.user!.userId);
    sendSuccess(res, 'Farms retrieved.', farms);
  } catch (err) {
    next(err);
  }
}

export async function getFarmById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const farm = await farmService.getFarmById(req.params.id, req.user!.userId);
    sendSuccess(res, 'Farm retrieved.', farm);
  } catch (err) {
    next(err);
  }
}