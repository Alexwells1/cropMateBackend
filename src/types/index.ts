import { Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────────────────────

export interface ILocation {
  latitude: number;
  longitude: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[] | unknown;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthTokenPayload {
  userId: string;
  phone: string;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  name: string;
  phone: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// FARM
// ─────────────────────────────────────────────────────────────────────────────

export type SoilTypeEnum =
  | 'Loamy'
  | 'Sandy'
  | 'Clay'
  | 'Silty'
  | 'Peaty'
  | 'Chalky'
  | 'Unknown';

export interface IFarm extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  farmName: string;
  farmSize: number;
  location: ILocation;
  soilType: SoilTypeEnum;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP
// ─────────────────────────────────────────────────────────────────────────────

export type CropStatus = 'growing' | 'harvested' | 'failed' | 'dormant';

export interface ICrop extends Document {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  cropName: string;
  plantingDate: Date;
  fieldArea: number;
  status: CropStatus;
  expectedHarvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP RECORD
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'fertilizer'
  | 'irrigation'
  | 'pesticide'
  | 'harvest'
  | 'planting'
  | 'weeding'
  | 'other';

export interface ICropRecord extends Document {
  _id: Types.ObjectId;
  cropId: Types.ObjectId;
  activityType: ActivityType;
  description: string;
  quantity?: string;
  activityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export type DiseaseSeverity = 'low' | 'medium' | 'high';



export interface IDiseaseDetection extends Document {
  _id: Types.ObjectId;
  cropId: Types.ObjectId;
  farmId: Types.ObjectId;
  userId: Types.ObjectId;
  imageUrl: string;
  publicId: string;
  detectedDisease: string;
  confidenceScore: number;
  treatment: string;
  preventionAdvice: string;
  severity: DiseaseSeverity;
  isHealthy: boolean;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}


// Define a lean version without Document
export type IDiseaseDetectionLean = Omit<IDiseaseDetection, keyof Document>;
// ─────────────────────────────────────────────────────────────────────────────
// SOIL DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface ISoilData extends Document {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  moistureLevel: number;
  source: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT
// ─────────────────────────────────────────────────────────────────────────────

export type AlertType = 'disease' | 'pest' | 'weather' | 'system';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  sourceFarmId: Types.ObjectId;
  diseaseName: string;
  description: string;
  alertType: AlertType;
  severity: AlertSeverity;
  location: ILocation;
  radiusKm: number;
  affectedFarmsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROTATION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export interface IRotationHistory extends Document {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  cropId: Types.ObjectId;
  previousCrop: string;
  seasonYear: number;
  recommendedNextCrop: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType = 'outbreak' | 'alert' | 'reminder' | 'system' | 'tip';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateUserDTO {
  name: string;
  phone: string;
  password: string;
}

export interface LoginUserDTO {
  phone: string;
  password: string;
}

export interface CreateFarmDTO {
  farmName: string;
  farmSize: number;
  location: ILocation;
  soilType: SoilTypeEnum;
}

export interface CreateCropDTO {
  farmId: string;
  cropName: string;
  plantingDate: string;
  fieldArea: number;
  status?: CropStatus;
  expectedHarvestDate?: string;
}

export interface UpdateCropDTO {
  cropName?: string;
  status?: CropStatus;
  expectedHarvestDate?: string;
  fieldArea?: number;
}

export interface LogCropActivityDTO {
  cropId: string;
  activityType: ActivityType;
  description: string;
  quantity?: string;
  activityDate: string;
}

export interface DiseaseDetectionResultDTO {
  cropId: string;
  imageUrl: string;
  publicId: string;
  detectedDisease: string;
  confidenceScore: number;
  treatment: string;
  preventionAdvice: string;
  severity: DiseaseSeverity;
  isHealthy: boolean;
}

export interface AuthResult {
  user: IUserPublic;
  token: string;
  refreshToken: string;
}
