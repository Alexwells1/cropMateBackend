import { Types } from 'mongoose';
import { DiseaseDetectionModel } from '../repository/diseaseDetection.model';
import { CropModel } from '../../crop/repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { AppError } from '../../../middleware/errorHandler';
import { IDiseaseDetection } from '../../../types';
import { uploadImageBuffer } from '../../../integrations/cloudinary';
import { detectDisease } from '../../../integrations/ai';
import { eventBus, DiseaseDetectedPayload } from '../../../infrastructure/events/eventBus';
import logger from '../../../infrastructure/logger';

export async function runDiseaseDetection(
  cropId: string,
  userId: string,
  imageBuffer: Buffer
): Promise<IDiseaseDetection> {
  // 1. Validate crop & farm ownership
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  const farm = await verifyFarmOwnership(crop.farmId.toString(), userId);

  // 2. Upload image to Cloudinary
  logger.info(`[Detection] Uploading image for crop: ${cropId}`);
  const uploaded = await uploadImageBuffer(imageBuffer, 'cropmate/detections');

  // 3. Send to AI service — pass cropName for constrained inference so the
  //    model only considers disease classes that belong to this crop type.
  //    Also pass the buffer as fallback in case the URL fetch fails.
  const cropName = crop.cropName;   // e.g. "Tomato", "Corn", "Pepper"
  logger.info(`[Detection] Calling AI service — image: ${uploaded.url}, crop: ${cropName}`);

  const aiResult = await detectDisease(uploaded.url, cropName, imageBuffer);

  // 4. Persist result
  const detection = await DiseaseDetectionModel.create({
    cropId: new Types.ObjectId(cropId),
    farmId: farm._id,
    userId: new Types.ObjectId(userId),
    imageUrl: uploaded.url,
    publicId: uploaded.publicId,
    detectedDisease: aiResult.disease,
    confidenceScore: aiResult.confidence,
    treatment: aiResult.treatment,
    preventionAdvice: aiResult.preventionAdvice,
    severity: aiResult.severity,
    isHealthy: aiResult.isHealthy,
    detectedAt: new Date(),
  });

  logger.info(`[Detection] Saved result: ${detection._id} — ${aiResult.disease}`);

  // 5. Emit event for outbreak alerting (non-blocking)
  //    Guard against "Unrecognised" results triggering false alerts
  if (!aiResult.isHealthy && aiResult.disease !== 'Unrecognised / Low Confidence') {
    const payload: DiseaseDetectedPayload = {
      detectionId: detection._id.toString(),
      farmId: farm._id.toString(),
      cropId,
      userId,
      diseaseName: aiResult.disease,
      severity: aiResult.severity,
      location: {
        latitude: farm.location.latitude,
        longitude: farm.location.longitude,
      },
    };
    eventBus.publish('disease.detected', payload);
  }

  return detection;
}

export async function getDetectionsByFarm(
  farmId: string,
  userId: string
): Promise<IDiseaseDetection[]> {
  await verifyFarmOwnership(farmId, userId);

  const detections = await DiseaseDetectionModel
    .find({ farmId: new Types.ObjectId(farmId) })
    .sort({ detectedAt: -1 })
    .lean<IDiseaseDetection[]>();

  return detections;
}

export async function getDetectionsByCrop(
  cropId: string,
  userId: string
): Promise<IDiseaseDetection[]> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);

  const detections = await DiseaseDetectionModel
    .find({ cropId: new Types.ObjectId(cropId) })
    .sort({ detectedAt: -1 })
    .exec();

  return detections;
}