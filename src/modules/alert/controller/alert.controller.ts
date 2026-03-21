import { Request, Response, NextFunction } from 'express';
import * as alertService from '../service/alert.service';
import { sendSuccess } from '../../../utils/response';

export async function getAllAlerts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { alerts, total } = await alertService.getAllAlerts(
      req.query['page'] as string | undefined,
      req.query['limit'] as string | undefined
    );

    const page = parseInt((req.query['page'] as string) ?? '1', 10);
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10);

    sendSuccess(res, 'Alerts retrieved.', alerts, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}
