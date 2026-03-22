// ============================================================
// CropMate - DiseaseDetection Model
//
// Schema changes:
//   clientId — optional frontend-generated idempotency key.
//
//   Detection idempotency works differently from farms/crops:
//   the image is uploaded to Cloudinary before the DB insert,
//   so a naive retry would upload the image twice. The clientId
//   index lets the service check for an existing detection with
//   the same key BEFORE uploading to Cloudinary, short-circuiting
//   the expensive pipeline entirely on a retry.
//
//   Index: sparse unique on (userId, clientId).
//   userId is included so two users can independently scan the
//   same crop without colliding on clientId.
// ============================================================

import { Schema, model } from 'mongoose';
import { IDiseaseDetection } from '../../../types';

export interface IDiseaseDetectionWithClientId extends IDiseaseDetection {
  clientId?: string;
}

const diseaseDetectionSchema = new Schema<IDiseaseDetectionWithClientId>(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'cropId is required'],
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'imageUrl is required'],
    },
    publicId: {
      type: String,
      required: [true, 'publicId is required'],
    },
    detectedDisease: {
      type: String,
      required: [true, 'detectedDisease is required'],
      trim: true,
    },
    confidenceScore: {
      type: Number,
      required: [true, 'confidenceScore is required'],
      min: 0,
      max: 1,
    },
    treatment: {
      type: String,
      required: [true, 'treatment is required'],
      trim: true,
    },
    preventionAdvice: {
      type: String,
      required: [true, 'preventionAdvice is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    isHealthy: {
      type: Boolean,
      required: true,
      default: false,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional client-generated idempotency key (frontend's localDetectionId).
    // Prevents duplicate Cloudinary uploads + DB inserts on SCAN_UPLOAD retry.
    clientId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

diseaseDetectionSchema.index({ farmId: 1, detectedAt: -1 });
diseaseDetectionSchema.index({ cropId: 1, detectedAt: -1 });
diseaseDetectionSchema.index({ userId: 1 });

// Sparse unique on (userId, clientId) — prevents duplicate uploads on retry.
diseaseDetectionSchema.index(
  { userId: 1, clientId: 1 },
  {
    unique: true,
    sparse: true,
    name: 'userId_clientId_detection_unique',
  }
);

export const DiseaseDetectionModel = model<IDiseaseDetectionWithClientId>(
  'DiseaseDetection',
  diseaseDetectionSchema
);