import { Types } from 'mongoose';
import { CropRecordModel } from '../repository/cropRecord.model';
import { CropModel } from '../../crop/repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { AppError } from '../../../middleware/errorHandler';
import { ICropRecord } from '../../../types';
import { LogActivityInput } from '../../../validations';

async function verifyCropAccess(cropId: string, userId: string): Promise<void> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);
}

export async function logActivity(
  userId: string,
  data: LogActivityInput
): Promise<ICropRecord> {
  await verifyCropAccess(data.cropId, userId);

  const record = await CropRecordModel.create({
    cropId: new Types.ObjectId(data.cropId),
    activityType: data.activityType,
    description: data.description,
    quantity: data.quantity,
    activityDate: new Date(data.activityDate),
  });

  return record;
}

export async function getRecordsByCrop(
  cropId: string,
  userId: string
): Promise<ICropRecord[]> {
  await verifyCropAccess(cropId, userId);

 return CropRecordModel.find({ cropId: new Types.ObjectId(cropId) })
  .sort({ activityDate: -1 })
  .lean() as unknown as Promise<ICropRecord[]>;
}
