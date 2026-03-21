import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload } from '../types';
import { sendError } from '../utils/response';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please provide a Bearer token.', 401);
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    sendError(res, 'Authentication token is missing.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Your session has expired. Please log in again.', 401);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid authentication token.', 401);
      return;
    }
    sendError(res, 'Authentication failed.', 401);
  }
}
