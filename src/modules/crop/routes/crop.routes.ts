import { Router } from 'express';
import * as cropController from '../controller/crop.controller';
import { validate } from '../../../middleware/validate';
import { authenticate } from '../../../middleware/authenticate';
import { createCropSchema, updateCropSchema } from '../../../validations';
import { getAllCrops } from '../controller/crop.controller';

const router = Router();
router.use(authenticate);

router.post('/', validate(createCropSchema), cropController.createCrop);
router.get('/farm/:farmId', cropController.getCropsByFarm);
router.patch('/:id', validate(updateCropSchema), cropController.updateCrop);
router.get('/all', authenticate, getAllCrops); 

export default router;
