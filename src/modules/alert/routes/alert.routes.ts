import { Router } from 'express';
import * as alertController from '../controller/alert.controller';
import { authenticate } from '../../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', alertController.getAllAlerts);

export default router;
