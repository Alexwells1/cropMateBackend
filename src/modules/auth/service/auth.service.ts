import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../repository/user.model';
import { config } from '../../../config';
import { AppError } from '../../../middleware/errorHandler';
import { AuthResult, AuthTokenPayload, IUserPublic } from '../../../types';
import { RegisterInput, LoginInput } from '../../../validations';
import logger from '../../../infrastructure/logger';

function signTokens(userId: string, phone: string): { token: string; refreshToken: string } {
  const payload: AuthTokenPayload = { userId, phone };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);

  return { token, refreshToken };
}

function toPublic(user: { _id: { toString(): string }; name: string; phone: string; createdAt: Date }): IUserPublic {
  return {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export async function registerUser(data: RegisterInput): Promise<AuthResult> {
  const existing = await UserModel.findOne({ phone: data.phone }).lean();
  if (existing) {
    throw new AppError('An account with this phone number already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await UserModel.create({
    name: data.name,
    phone: data.phone,
    passwordHash,
  });

  logger.info(`[Auth] New farmer registered: ${user._id}`);

  const { token, refreshToken } = signTokens(user._id.toString(), user.phone);

  return { user: toPublic(user), token, refreshToken };
}

export async function loginUser(data: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ phone: data.phone }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid phone number or password.', 401);
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('Invalid phone number or password.', 401);
  }

  logger.info(`[Auth] Farmer logged in: ${user._id}`);

  const { token, refreshToken } = signTokens(user._id.toString(), user.phone);

  return { user: toPublic(user), token, refreshToken };
}

export async function getProfile(userId: string): Promise<IUserPublic> {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw new AppError('User not found.', 404);
  return toPublic(user);
}
