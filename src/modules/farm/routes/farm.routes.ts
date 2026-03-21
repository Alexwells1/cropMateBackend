import { Router } from 'express';
import * as farmController from '../controller/farm.controller';
import { validate } from '../../../middleware/validate';
import { authenticate } from '../../../middleware/authenticate';
import { createFarmSchema } from '../../../validations';

const router = Router();
router.use(authenticate);

router.post('/', validate(createFarmSchema), farmController.createFarm);
router.get('/user', farmController.getUserFarms);
router.get('/:id', farmController.getFarmById);

export default router;
