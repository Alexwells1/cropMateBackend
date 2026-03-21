import { Schema, model } from 'mongoose';
import { IAlert } from '../../../types';

const alertSchema = new Schema<IAlert>(
  {
    sourceFarmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'sourceFarmId is required'],
      index: true,
    },
    diseaseName: {
      type: String,
      required: [true, 'diseaseName is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    alertType: {
      type: String,
      enum: ['disease', 'pest', 'weather', 'system'],
      default: 'disease',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    radiusKm: {
      type: Number,
      required: true,
      min: 0.1,
    },
    affectedFarmsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

alertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
alertSchema.index({ createdAt: -1 });

export const AlertModel = model<IAlert>('Alert', alertSchema);
