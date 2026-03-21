import { Router } from 'express';
import * as authController from '../controller/auth.controller';
import { validate } from '../../../middleware/validate';
import { authenticate } from '../../../middleware/authenticate';
import { authRateLimiter } from '../../../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../../../validations';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/profile  [protected]
router.get('/profile', authenticate, authController.getProfile);

export default router;
