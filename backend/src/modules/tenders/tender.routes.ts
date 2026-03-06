import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as tenderController from './tender.controller';

const router = Router();

router.use(requireAuth);

router.post('/', tenderController.createTender);
router.get('/', tenderController.listTenders);
router.get('/:id', tenderController.getTender);
router.post('/:id/issue', tenderController.issueTender);
router.patch('/:id', tenderController.updateTender);
router.get('/:id/preview', tenderController.previewTender);

export default router;
