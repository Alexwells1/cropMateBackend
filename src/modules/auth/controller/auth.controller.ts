import { Request, Response, NextFunction } from 'express';
import * as authService from '../service/auth.service';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { RegisterInput, LoginInput } from '../../../validations';

export async function register(
  req: Request<Record<string, never>, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    sendCreated(res, 'Account created successfully.', result);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<Record<string, never>, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    sendSuccess(res, 'Login successful.', result);
  } catch (err) {
    next(err);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);
    sendSuccess(res, 'Profile retrieved.', user);
  } catch (err) {
    next(err);
  }
}
