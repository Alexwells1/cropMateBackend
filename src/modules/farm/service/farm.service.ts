import { Types } from 'mongoose';
import { FarmModel } from '../repository/farm.model';
import { AppError } from '../../../middleware/errorHandler';
import { IFarm } from '../../../types';
import { CreateFarmInput } from '../../../validations';
import { cacheGet, cacheSet, cacheDel } from '../../../infrastructure/cache/redis';
import logger from '../../../infrastructure/logger';

export async function createFarm(userId: string, data: CreateFarmInput): Promise<IFarm> {
  const farm = await FarmModel.create({
    userId: new Types.ObjectId(userId),
    farmName: data.farmName,
    farmSize: data.farmSize,
    location: data.location,
    soilType: data.soilType,
  });

  await cacheDel(`farms:user:${userId}`);
  logger.info(`[Farm] Created: ${farm._id} by user: ${userId}`);
  return farm;
}

export async function getFarmsByUser(userId: string): Promise<IFarm[]> {
  const cacheKey = `farms:user:${userId}`;
  const cached = await cacheGet<IFarm[]>(cacheKey);
  if (cached) return cached;

  const farms = await FarmModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean() as IFarm[];

  await cacheSet(cacheKey, farms, 300);
  return farms;
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

  const farm = await FarmModel.findById(farmId).lean() as IFarm | null;
  if (!farm) throw new AppError('Farm not found.', 404);

  if (farm.userId.toString() !== userId) {
    throw new AppError('You do not have access to this farm.', 403);
  }

  await cacheSet(cacheKey, farm, 300);
  return farm;
}

export async function verifyFarmOwnership(farmId: string, userId: string): Promise<IFarm> {
  return getFarmById(farmId, userId);
}
