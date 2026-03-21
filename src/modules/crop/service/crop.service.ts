import { Types } from 'mongoose';
import { CropModel } from '../repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { AppError } from '../../../middleware/errorHandler';
import { ICrop } from '../../../types';
import { CreateCropInput, UpdateCropInput } from '../../../validations';
import logger from '../../../infrastructure/logger';
import { FarmModel } from '../../farm/repository/farm.model';

export async function createCrop(userId: string, data: CreateCropInput): Promise<ICrop> {
  await verifyFarmOwnership(data.farmId, userId);

  const crop = await CropModel.create({
    farmId: new Types.ObjectId(data.farmId),
    cropName: data.cropName,
    plantingDate: new Date(data.plantingDate),
    fieldArea: data.fieldArea,
    status: data.status,
    expectedHarvestDate: data.expectedHarvestDate ? new Date(data.expectedHarvestDate) : undefined,
  });

  logger.info(`[Crop] Created: ${crop._id} on farm: ${data.farmId}`);
  return crop;
}

export async function getCropsByFarm(farmId: string, userId: string): Promise<ICrop[]> {
  await verifyFarmOwnership(farmId, userId);

  return CropModel.find({ farmId: new Types.ObjectId(farmId) })
    .sort({ createdAt: -1 })
    .lean<ICrop[]>()
    .exec();
}

export async function updateCrop(
  cropId: string,
  userId: string,
  data: UpdateCropInput
): Promise<ICrop> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean() as ICrop | null;
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);

  const updated = await CropModel.findByIdAndUpdate(
    cropId,
    {
      ...data,
      ...(data.expectedHarvestDate ? { expectedHarvestDate: new Date(data.expectedHarvestDate) } : {}),
    },
    { new: true, runValidators: true }
  );

  if (!updated) throw new AppError('Failed to update crop.', 500);
  return updated;
}

export async function getCropById(cropId: string, userId: string): Promise<ICrop> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean() as ICrop | null;
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);
  return crop;
}

export async function getAllCropsByUser(userId: string): Promise<ICrop[]> {
  const farms = await FarmModel.find({ userId: new Types.ObjectId(userId) })
    .select('_id')
    .lean()
    .exec();

  const farmIds = farms.map((f) => f._id);

  const crops = await CropModel.find({ farmId: { $in: farmIds } })
    .populate('farmId', 'farmName') 
    .sort({ createdAt: -1 })
    .lean<ICrop[]>() 
    .exec();

  return crops;
}
