import { Router } from 'express';
import * as recordController from '../controller/cropRecord.controller';
import { validate } from '../../../middleware/validate';
import { authenticate } from '../../../middleware/authenticate';
import { logActivitySchema } from '../../../validations';

const router = Router();
router.use(authenticate);

router.post('/', validate(logActivitySchema), recordController.logActivity);
router.get('/crop/:cropId', recordController.getRecordsByCrop);

export default router;
