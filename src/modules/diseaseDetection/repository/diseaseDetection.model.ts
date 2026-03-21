import { Schema, model } from 'mongoose';
import { IDiseaseDetection } from '../../../types';

const diseaseDetectionSchema = new Schema<IDiseaseDetection>(
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

diseaseDetectionSchema.index({ farmId: 1, detectedAt: -1 });
diseaseDetectionSchema.index({ cropId: 1, detectedAt: -1 });
diseaseDetectionSchema.index({ userId: 1 });

export const DiseaseDetectionModel = model<IDiseaseDetection>(
  'DiseaseDetection',
  diseaseDetectionSchema
);
