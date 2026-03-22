// ============================================================
// CropMate - CropRecord Service
//
// Idempotency (Phase 1):
//   logActivity accepts an optional clientId. When present, uses
//   findOneAndUpdate with upsert on (cropId, clientId).
//   A RECORD_LOG retry with the same clientId returns the existing
//   record — no duplicate activity logged.
//
// Phase 6 — timestamp consistency:
//   serializeRecord() converts all Date fields to ISO strings.
// ============================================================

import { Types } from 'mongoose';
import { CropRecordModel } from '../repository/cropRecord.model';
import { CropModel } from '../../crop/repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { AppError } from '../../../middleware/errorHandler';
import { ICropRecord } from '../../../types';
import { LogActivityInput } from '../../../validations';
import logger from '../../../infrastructure/logger';

async function verifyCropAccess(cropId: string, userId: string): Promise<void> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);
}

// ── Serialiser ────────────────────────────────────────────────
function serializeRecord(doc: any): ICropRecord {
  return {
    ...doc,
    _id: doc._id?.toString() ?? doc._id,
    cropId: doc.cropId?.toString() ?? doc.cropId,
    activityDate: doc.activityDate instanceof Date
      ? doc.activityDate.toISOString()
      : doc.activityDate,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt,
  } as unknown as ICropRecord;
}

export async function logActivity(
  userId: string,
  data: LogActivityInput & { clientId?: string }
): Promise<ICropRecord> {
  await verifyCropAccess(data.cropId, userId);

  if (data.clientId) {
    // ── Idempotent path ───────────────────────────────────────
    // findOneAndUpdate with upsert on (cropId, clientId).
    // A retry returns the existing record — no duplicate.
    const record = await CropRecordModel.findOneAndUpdate(
      {
        cropId: new Types.ObjectId(data.cropId),
        clientId: data.clientId,
      },
      {
        $setOnInsert: {
          cropId: new Types.ObjectId(data.cropId),
          activityType: data.activityType,
          description: data.description,
          quantity: data.quantity,
          activityDate: new Date(data.activityDate),
          clientId: data.clientId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    if (!record) throw new AppError('Failed to log activity.', 500);

    logger.info(`[Record] Upsert (clientId=${data.clientId}): ${record._id} on crop: ${data.cropId}`);
    return serializeRecord(record);
  }

  // ── Standard path (no clientId) ──────────────────────────
  const record = await CropRecordModel.create({
    cropId: new Types.ObjectId(data.cropId),
    activityType: data.activityType,
    description: data.description,
    quantity: data.quantity,
    activityDate: new Date(data.activityDate),
  });

  logger.info(`[Record] Created: ${record._id} on crop: ${data.cropId}`);
  return serializeRecord(record.toObject());
}

export async function getRecordsByCrop(
  cropId: string,
  userId: string
): Promise<ICropRecord[]> {
  await verifyCropAccess(cropId, userId);

  const records = await CropRecordModel.find({ cropId: new Types.ObjectId(cropId) })
    .sort({ activityDate: -1 })
    .lean()
    .exec();

  return records.map(serializeRecord);
}