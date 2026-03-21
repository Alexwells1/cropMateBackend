import { Router } from 'express';
import * as notificationController from '../controller/notification.controller';
import { authenticate } from '../../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markOneRead);

export default router;
