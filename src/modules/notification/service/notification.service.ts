import { Types } from 'mongoose';
import { NotificationModel } from '../repository/notification.model';
import { AppError } from '../../../middleware/errorHandler';
import { INotification } from '../../../types';
import { parsePagination } from '../../../utils/geo';

export interface NotificationListResult {
  notifications: INotification[];
  unreadCount: number;
  total: number;
}

export async function getUserNotifications(
  userId: string,
  page: string | undefined,
  limit: string | undefined
): Promise<NotificationListResult> {
  const { skip, limit: take } = parsePagination(page, limit);

  const [notifications, total, unreadCount] = await Promise.all([
    NotificationModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .lean() as Promise<INotification[]>,
    NotificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    NotificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false }),
  ]);

  return { notifications, unreadCount, total };
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const result = await NotificationModel.updateMany(
    { userId: new Types.ObjectId(userId), read: false },
    { $set: { read: true } }
  );
  return { updated: result.modifiedCount };
}

export async function markOneRead(
  notificationId: string,
  userId: string
): Promise<INotification> {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Invalid notification ID.', 400);
  }

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found.', 404);
  return notification;
}
