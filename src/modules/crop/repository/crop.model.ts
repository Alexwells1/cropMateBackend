import { Schema, model } from 'mongoose';
import { ICrop } from '../../../types';

const cropSchema = new Schema<ICrop>(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
      minlength: [2, 'Crop name must be at least 2 characters'],
      maxlength: [100, 'Crop name cannot exceed 100 characters'],
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required'],
    },
    fieldArea: {
      type: Number,
      required: [true, 'Field area is required'],
      min: [0.01, 'Field area must be positive'],
    },
    status: {
      type: String,
      enum: ['growing', 'harvested', 'failed', 'dormant'],
      default: 'growing',
    },
    expectedHarvestDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cropSchema.index({ farmId: 1, status: 1 });
cropSchema.index({ farmId: 1, createdAt: -1 });

export const CropModel = model<ICrop>('Crop', cropSchema);
