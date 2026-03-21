import { Router } from 'express';
import * as soilController from '../controller/soil.controller';
import { authenticate } from '../../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/:farmId', soilController.getSoilInsights);

export default router;
