
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

// ── Serialiser ────────────────────────────────────────────────
// Ensures all returned detection objects have ISO string timestamps
// and plain string IDs — safe for SQLite storage on the frontend.
export function serializeDetection(doc: any): IDiseaseDetection {
  return {
    ...doc,
    _id:        doc._id?.toString()    ?? doc._id,
    cropId:     doc.cropId?.toString() ?? doc.cropId,
    farmId:     doc.farmId?.toString() ?? doc.farmId,
    userId:     doc.userId?.toString() ?? doc.userId,
    detectedAt: doc.detectedAt instanceof Date ? doc.detectedAt.toISOString() : doc.detectedAt,
    createdAt:  doc.createdAt instanceof Date  ? doc.createdAt.toISOString()  : doc.createdAt,
    updatedAt:  doc.updatedAt instanceof Date  ? doc.updatedAt.toISOString()  : doc.updatedAt,
  } as unknown as IDiseaseDetection;
}

export async function runDiseaseDetection(
  cropId:      string,
  userId:      string,
  imageBuffer: Buffer,
  clientId?:   string,          // undefined = no idempotency key, never null
): Promise<IDiseaseDetection> {

  // ── Idempotency check ──────────────────────────────────────
  // Only run when clientId is a non-empty string.
  // null / undefined both skip this block — clientId will then be
  // omitted from the insert so the sparse index is never triggered.
  if (clientId) {
    const existing = await DiseaseDetectionModel.findOne({
      userId: new Types.ObjectId(userId),
      clientId,
    }).lean();

    if (existing) {
      logger.info(`[Detection] Idempotent return for clientId=${clientId}: ${existing._id}`);
      return serializeDetection(existing);
    }
  }

  // 1. Validate crop & farm ownership
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  const farm = await verifyFarmOwnership(crop.farmId.toString(), userId);

  // 2. Upload image to Cloudinary
  logger.info(`[Detection] Uploading image for crop: ${cropId}`);
  const uploaded = await uploadImageBuffer(imageBuffer, 'cropmate/detections');

  // 3. Call AI service — pass buffer so Gradio receives base64 directly,
  //    no second Cloudinary fetch needed.
  const cropName = crop.cropName;
  logger.info(`[Detection] Calling AI service — image: ${uploaded.url}, crop: ${cropName}`);
  const aiResult = await detectDisease(uploaded.url, cropName, imageBuffer);

  // 4. Persist result
  //    IMPORTANT: clientId is spread in only when it is a truthy string.
  //    Storing null would make the sparse unique index treat every
  //    null-clientId row as a duplicate of each other.
  const detection = await DiseaseDetectionModel.create({
    cropId:           new Types.ObjectId(cropId),
    farmId:           farm._id,
    userId:           new Types.ObjectId(userId),
    imageUrl:         uploaded.url,
    publicId:         uploaded.publicId,
    detectedDisease:  aiResult.disease,
    confidenceScore:  aiResult.confidence,
    treatment:        aiResult.treatment,
    preventionAdvice: aiResult.preventionAdvice,
    severity:         aiResult.severity,
    isHealthy:        aiResult.isHealthy,
    detectedAt:       new Date(),
    // ↓ Field is omitted entirely when clientId is falsy —
    //   sparse index only skips absent fields, not null ones.
    ...(clientId ? { clientId } : {}),
  });

  logger.info(`[Detection] Saved: ${detection._id} — ${aiResult.disease}`);

  // 5. Emit outbreak event (non-blocking)
  if (!aiResult.isHealthy && aiResult.disease !== 'Unrecognised / Low Confidence') {
    const payload: DiseaseDetectedPayload = {
      detectionId: detection._id.toString(),
      farmId:      farm._id.toString(),
      cropId,
      userId,
      diseaseName: aiResult.disease,
      severity:    aiResult.severity,
      location: {
        latitude:  farm.location.latitude,
        longitude: farm.location.longitude,
      },
    };
    eventBus.publish('disease.detected', payload);
  }

  return serializeDetection(detection.toObject());
}

export async function getDetectionsByFarm(
  farmId: string,
  userId: string,
): Promise<IDiseaseDetection[]> {
  await verifyFarmOwnership(farmId, userId);

  const detections = await DiseaseDetectionModel
    .find({ farmId: new Types.ObjectId(farmId) })
    .sort({ detectedAt: -1 })
    .lean();

  return detections.map(serializeDetection);
}

export async function getDetectionsByCrop(
  cropId: string,
  userId: string,
): Promise<IDiseaseDetection[]> {
  if (!Types.ObjectId.isValid(cropId)) throw new AppError('Invalid crop ID.', 400);

  const crop = await CropModel.findById(cropId).lean();
  if (!crop) throw new AppError('Crop not found.', 404);

  await verifyFarmOwnership(crop.farmId.toString(), userId);

  const detections = await DiseaseDetectionModel
    .find({ cropId: new Types.ObjectId(cropId) })
    .sort({ detectedAt: -1 })
    .lean();

  return detections.map(serializeDetection);
}