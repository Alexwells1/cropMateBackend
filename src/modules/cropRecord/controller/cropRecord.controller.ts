// ============================================================
// CropMate - CropRecord Controller
//
// Change: passes clientId from request body to logActivity service
// so idempotent retry is supported for RECORD_LOG actions.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import * as recordService from '../service/cropRecord.service';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { LogActivityInput } from '../../../validations';

export async function logActivity(
  req: Request<Record<string, never>, unknown, LogActivityInput & { clientId?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const record = await recordService.logActivity(req.user!.userId, req.body);
    sendCreated(res, 'Activity logged successfully.', record);
  } catch (err) {
    next(err);
  }
}

export async function getRecordsByCrop(
  req: Request<{ cropId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const records = await recordService.getRecordsByCrop(
      req.params.cropId,
      req.user!.userId
    );
    sendSuccess(res, 'Records retrieved.', records);
  } catch (err) {
    next(err);
  }
}