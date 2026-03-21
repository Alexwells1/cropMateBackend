import { Request, Response, NextFunction } from 'express';
import * as soilService from '../service/soil.service';
import { sendSuccess } from '../../../utils/response';

export async function getSoilInsights(
  req: Request<{ farmId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const insights = await soilService.getSoilInsights(
      req.params.farmId,
      req.user!.userId
    );
    sendSuccess(res, 'Soil insights retrieved.', insights);
  } catch (err) {
    next(err);
  }
}
