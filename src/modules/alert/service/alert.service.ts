import { Types } from 'mongoose';
import { AlertModel } from '../repository/alert.model';
import { FarmModel } from '../../farm/repository/farm.model';
import { NotificationModel } from '../../notification/repository/notification.model';
import { IAlert, AlertSeverity } from '../../../types';
import { filterNearbyFarms } from '../../../integrations/maps';
import { config } from '../../../config';
import { DiseaseDetectedPayload } from '../../../infrastructure/events/eventBus';
import { parsePagination } from '../../../utils/geo';
import logger from '../../../infrastructure/logger';

const SEVERITY_MAP: Record<'low' | 'medium' | 'high', AlertSeverity> = {
  low: 'low',
  medium: 'high',
  high: 'critical',
};

export async function createOutbreakAlert(
  payload: DiseaseDetectedPayload
): Promise<IAlert> {
  const { farmId, diseaseName, severity, location } = payload;

  // Find ALL other farms — exclude the source farm
  const allFarms = await FarmModel.find({
    _id: { $ne: new Types.ObjectId(farmId) },
  })
    .select('_id userId location')
    .lean();

  const nearbyFarms = filterNearbyFarms(location, allFarms, config.alerts.radiusKm);

  // Create the alert record
  const alert = await AlertModel.create({
    sourceFarmId: new Types.ObjectId(farmId),
    diseaseName,
    description:
      `${diseaseName} has been detected on a farm near you. ` +
      `Inspect your crops immediately and take preventive action.`,
    alertType: 'disease',
    severity: SEVERITY_MAP[severity],
    location,
    radiusKm: config.alerts.radiusKm,
    affectedFarmsCount: nearbyFarms.length,
  });

  logger.info(
    `[Alert] Created: ${alert._id} for "${diseaseName}" — ${nearbyFarms.length} farms notified`
  );

  // Bulk-insert notifications for all nearby farmers
  if (nearbyFarms.length > 0) {
    const notifications = nearbyFarms.map((f) => ({
      userId: new Types.ObjectId(f.userId),
      title: '⚠️ Disease Alert — Inspect Your Crops',
      message:
        `${diseaseName} was detected on a farm within ${config.alerts.radiusKm}km of yours. ` +
        `Check your crops immediately.`,
      type: 'outbreak' as const,
      read: false,
      metadata: {
        alertId: alert._id.toString(),
        diseaseName,
        distanceKm: parseFloat(f.distanceKm.toFixed(2)),
      },
    }));

    await NotificationModel.insertMany(notifications);
    logger.info(`[Alert] Notifications dispatched to ${nearbyFarms.length} nearby farmers`);
  }

  return alert;
}

export async function getAllAlerts(
  page: string | undefined,
  limit: string | undefined
): Promise<{ alerts: IAlert[]; total: number }> {
  const { skip, limit: take } = parsePagination(page, limit);

  const [alerts, total] = await Promise.all([
    AlertModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .lean() as Promise<IAlert[]>,
    AlertModel.countDocuments(),
  ]);

  return { alerts, total };
}
