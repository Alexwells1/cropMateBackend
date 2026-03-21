import { Schema, model } from 'mongoose';
import { IRotationHistory } from '../../../types';

const rotationHistorySchema = new Schema<IRotationHistory>(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'cropId is required'],
    },
    previousCrop: {
      type: String,
      required: [true, 'previousCrop is required'],
      trim: true,
    },
    seasonYear: {
      type: Number,
      required: [true, 'seasonYear is required'],
      min: 2000,
      max: 2100,
    },
    recommendedNextCrop: {
      type: String,
      required: [true, 'recommendedNextCrop is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'reason is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rotationHistorySchema.index({ farmId: 1, seasonYear: -1 });

export const RotationHistoryModel = model<IRotationHistory>(
  'RotationHistory',
  rotationHistorySchema
);
