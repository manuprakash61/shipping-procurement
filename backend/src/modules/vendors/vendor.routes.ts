import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as vendorController from './vendor.controller';

const router = Router();

router.use(requireAuth);

router.get('/:id', vendorController.getVendor);
router.patch('/:id', vendorController.updateVendor);
router.post('/:id/verify-email', vendorController.verifyEmail);
router.get('/:id/emails', vendorController.getEmails);
router.post('/:id/emails', vendorController.addEmail);

export default router;
