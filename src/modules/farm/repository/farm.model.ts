import { Schema, model } from 'mongoose';
import { IFarm } from '../../../types';

const farmSchema = new Schema<IFarm>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      minlength: [2, 'Farm name must be at least 2 characters'],
      maxlength: [150, 'Farm name cannot exceed 150 characters'],
    },
    farmSize: {
      type: Number,
      required: [true, 'Farm size is required'],
      min: [0.01, 'Farm size must be positive'],
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180,
      },
    },
    soilType: {
      type: String,
      enum: ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky', 'Unknown'],
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

farmSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const FarmModel = model<IFarm>('Farm', farmSchema);
