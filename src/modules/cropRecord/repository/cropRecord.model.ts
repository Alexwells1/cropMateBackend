import { Schema, model } from 'mongoose';
import { ICropRecord } from '../../../types';

const cropRecordSchema = new Schema<ICropRecord>(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'cropId is required'],
      index: true,
    },
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: ['fertilizer', 'irrigation', 'pesticide', 'harvest', 'planting', 'weeding', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    activityDate: {
      type: Date,
      required: [true, 'Activity date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cropRecordSchema.index({ cropId: 1, activityDate: -1 });
cropRecordSchema.index({ cropId: 1, activityType: 1 });

export const CropRecordModel = model<ICropRecord>('CropRecord', cropRecordSchema);
