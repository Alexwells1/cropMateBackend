import { Request, Response, NextFunction } from 'express';
import * as rotationService from '../service/rotation.service';
import { sendSuccess } from '../../../utils/response';

export async function getRotationPlan(
  req: Request<{ farmId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const plan = await rotationService.getRotationPlan(
      req.params.farmId,
      req.user!.userId
    );
    sendSuccess(res, 'Crop rotation plan retrieved.', plan);
  } catch (err) {
    next(err);
  }
}
