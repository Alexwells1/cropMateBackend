import { Router } from 'express';
import * as rotationController from '../controller/rotation.controller';
import { authenticate } from '../../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/:farmId', rotationController.getRotationPlan);

export default router;
