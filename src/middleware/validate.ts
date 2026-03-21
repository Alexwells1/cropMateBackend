import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { ValidationError } from '../types';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      // Replace with coerced/parsed result (e.g. default values applied)
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: ValidationError[] = err.errors.map((e) => ({
          field: e.path.join('.') || 'unknown',
          message: e.message,
        }));
        sendError(res, 'Validation failed. Please check your input.', 422, errors);
        return;
      }
      next(err);
    }
  };
}
