import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../service/notification.service';
import { sendSuccess } from '../../../utils/response';

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.getUserNotifications(
      req.user!.userId,
      req.query['page'] as string | undefined,
      req.query['limit'] as string | undefined
    );

    const page = parseInt((req.query['page'] as string) ?? '1', 10);
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10);

    sendSuccess(res, 'Notifications retrieved.', result, 200, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.markAllRead(req.user!.userId);
    sendSuccess(res, `${result.updated} notification(s) marked as read.`, result);
  } catch (err) {
    next(err);
  }
}

export async function markOneRead(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = await notificationService.markOneRead(
      req.params.id,
      req.user!.userId
    );
    sendSuccess(res, 'Notification marked as read.', notification);
  } catch (err) {
    next(err);
  }
}
