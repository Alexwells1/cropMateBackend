// ============================================================
// CropMate - Farm Service
//
// Phase 1 — Idempotency:
//   createFarm accepts an optional clientId. When present, uses
//   findOneAndUpdate with upsert on (userId, clientId).
//   A FARM_CREATE retry with the same clientId returns the existing
//   document — no duplicate farm created.
//
// Phase 6 — Timestamp consistency:
//   serializeFarm() converts all Date fields to ISO strings and
//   ObjectIds to plain strings.
// ============================================================

import { Types } from 'mongoose';
import { FarmModel } from '../repository/farm.model';
import { AppError } from '../../../middleware/errorHandler';
import { IFarm } from '../../../types';
import { CreateFarmInput } from '../../../validations';
import { cacheGet, cacheSet, cacheDel } from '../../../infrastructure/cache/redis';
import logger from '../../../infrastructure/logger';

// ── Serialiser ────────────────────────────────────────────────
function serializeFarm(doc: any): IFarm {
  return {
    ...doc,
    _id: doc._id?.toString() ?? doc._id,
    userId: doc.userId?.toString() ?? doc.userId,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt,
  } as unknown as IFarm;
}

export async function createFarm(
  userId: string,
  data: CreateFarmInput & { clientId?: string }
): Promise<IFarm> {
  if (data.clientId) {
    // ── Idempotent path ───────────────────────────────────────
    const farm = await FarmModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        clientId: data.clientId,
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          farmName: data.farmName,
          farmSize: data.farmSize,
          location: data.location,
          soilType: data.soilType ?? 'Unknown',
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

    if (!farm) throw new AppError('Failed to create farm.', 500);

    await cacheDel(`farms:user:${userId}`);
    logger.info(`[Farm] Upsert (clientId=${data.clientId}): ${farm._id} by user: ${userId}`);
    return serializeFarm(farm);
  }

  // ── Standard path (no clientId) ──────────────────────────
  const farm = await FarmModel.create({
    userId: new Types.ObjectId(userId),
    farmName: data.farmName,
    farmSize: data.farmSize,
    location: data.location,
    soilType: data.soilType ?? 'Unknown',
  });

  await cacheDel(`farms:user:${userId}`);
  logger.info(`[Farm] Created: ${farm._id} by user: ${userId}`);
  return serializeFarm(farm.toObject());
}

export async function getFarmsByUser(userId: string): Promise<IFarm[]> {
  const cacheKey = `farms:user:${userId}`;
  const cached = await cacheGet<IFarm[]>(cacheKey);
  if (cached) return cached;

  const farms = await FarmModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  const serialized = farms.map(serializeFarm);
  await cacheSet(cacheKey, serialized, 300);
  return serialized;
}

export async function getFarmById(farmId: string, userId: string): Promise<IFarm> {
  if (!Types.ObjectId.isValid(farmId)) throw new AppError('Invalid farm ID.', 400);

  const cacheKey = `farms:${farmId}`;
  const cached = await cacheGet<IFarm>(cacheKey);

  if (cached) {
    if (cached.userId.toString() !== userId) {
      throw new AppError('You do not have access to this farm.', 403);
    }
    return cached;
  }

  const farm = await FarmModel.findById(farmId).lean();
  if (!farm) throw new AppError('Farm not found.', 404);

  if (farm.userId.toString() !== userId) {
    throw new AppError('You do not have access to this farm.', 403);
  }

  const serialized = serializeFarm(farm);
  await cacheSet(cacheKey, serialized, 300);
  return serialized;
}

export async function verifyFarmOwnership(farmId: string, userId: string): Promise<IFarm> {
  return getFarmById(farmId, userId);
}