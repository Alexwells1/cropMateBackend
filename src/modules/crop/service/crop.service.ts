// ============================================================
// CropMate - Crop Service
//
// Idempotency (Phase 1):
//   createCrop accepts an optional clientId. When present, it uses
//   findOneAndUpdate with upsert on (farmId, clientId). A retry with
//   the same clientId returns the existing document — no duplicate.
//
// Phase 3 fix — getAllCropsByUser:
//   Removed .populate('farmId', 'farmName'). The populate was replacing
//   the farmId ObjectId with a {_id, farmName} object, breaking the
//   frontend's upsertCrops() which maps c.farmId as string.
//   farmId is now returned as a plain string. If the client needs the
//   farm name it should join against its own cached farms table.
//
// Phase 6 — timestamp consistency:
//   All returned documents go through serializeCrop() which converts
//   Date fields to ISO strings explicitly. This guarantees the frontend
//   SQLite layer always receives parseable strings, regardless of
//   Mongoose lean/non-lean behavior.
// ============================================================

import { Types } from 'mongoose';
import { CropModel } from '../repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { AppError } from '../../../middleware/errorHandler';
import { ICrop } from '../../../types';
import { CreateCropInput, UpdateCropInput } from '../../../validations';
import logger from '../../../infrastructure/logger';
import { FarmModel } from '../../farm/repository/farm.model';

// ── Serialiser ────────────────────────────────────────────────
// Converts all Date fields to ISO strings and ensures _id is a string.
// Used on every document returned from this service so the frontend
// always receives a consistent JSON shape regardless of Mongoose
// lean vs non-lean behavior.
function serializeCrop(doc: any): ICrop {
  return {
    ...doc,
    _id: doc._id?.toString() ?? doc._id,
    farmId: doc.farmId?.toString() ?? doc.farmId,
    plantingDate: doc.plantingDate instanceof Date
      ? doc.plantingDate.toISOString()
      : doc.plantingDate,
    expectedHarvestDate: doc.expectedHarvestDate instanceof Date
      ? doc.expectedHarvestDate.toISOString()
      : doc.expectedHarvestDate,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt,
  } as unknown as ICrop;
}

export async function createCrop(
  userId: string,
  data: CreateCropInput & { clientId?: string }
): Promise<ICrop> {
  await verifyFarmOwnership(data.farmId, userId);

  if (data.clientId) {
    // ── Idempotent path ───────────────────────────────────────
    // findOneAndUpdate with upsert: a retry with the same clientId
    // returns the existing document without creating a duplicate.
    const crop = await CropModel.findOneAndUpdate(
      {
        farmId: new Types.ObjectId(data.farmId),
        clientId: data.clientId,
      },
      {
        $setOnInsert: {
          farmId: new Types.ObjectId(data.farmId),
          cropName: data.cropName,
          plantingDate: new Date(data.plantingDate),
          fieldArea: data.fieldArea,
          status: data.status ?? 'growing',
          expectedHarvestDate: data.expectedHarvestDate
            ? new Date(data.expectedHarvestDate)
            : undefined,
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

    if (!crop) throw new AppError('Failed to create crop.', 500);

    logger.info(`[Crop] Upsert (clientId=${data.clientId}): ${crop._id} on farm: ${data.farmId}`);
    return serializeCrop(crop);
  }

  // ── Standard path (no clientId) ──────────────────────────
  const crop = await CropModel.create({
    farmId: new Types.ObjectId(data.farmId),
    cropName: data.cropName,
    plantingDate: new Date(data.plantingDate),
    fieldArea: data.fieldArea,
    status: data.status ?? 'growing',
    expectedHarvestDate: data.expectedHarvestDate
      ? new Date(data.expectedHarvestDate)
      : undefined,
  });

  logger.info(`[Crop] Created: ${crop._id} on farm: ${data.farmId}`);
  return serializeCrop(crop.toObject());
}

export async function getCropsByFarm(farmId: string, userId: string): Promise<ICrop[]> {
  await verifyFarmOwnership(farmId, userId);

  const crops = await CropModel.find({ farmId: new Types.ObjectId(farmId) })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return crops.map(serializeCrop);
}

export async function updateCrop(
  cropId: string,
  userId: string,
  data: UpdateCropInput
): Promise<ICrop> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);

  const updated = await CropModel.findByIdAndUpdate(
    cropId,
    {
      ...data,
      ...(data.expectedHarvestDate
        ? { expectedHarvestDate: new Date(data.expectedHarvestDate) }
        : {}),
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new AppError('Failed to update crop.', 500);
  return serializeCrop(updated);
}

export async function getCropById(cropId: string, userId: string): Promise<ICrop> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);
  return serializeCrop(crop);
}

// Phase 3 fix: removed .populate('farmId', 'farmName').
// populate was replacing the farmId ObjectId with {_id, farmName},
// breaking the frontend's upsertCrops() which expects a plain string.
// The frontend resolves farm names from its own cached farms table.
export async function getAllCropsByUser(userId: string): Promise<ICrop[]> {
  const farms = await FarmModel.find({ userId: new Types.ObjectId(userId) })
    .select('_id')
    .lean()
    .exec();

  const farmIds = farms.map((f) => f._id);

  const crops = await CropModel.find({ farmId: { $in: farmIds } })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return crops.map(serializeCrop);
}