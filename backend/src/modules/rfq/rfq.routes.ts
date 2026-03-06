import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as rfqController from './rfq.controller';

const router = Router();

router.use(requireAuth);

router.post('/', rfqController.createRFQ);
router.get('/', rfqController.listRFQs);
router.get('/:id', rfqController.getRFQ);
router.patch('/:id', rfqController.updateRFQ);
router.post('/:id/send', rfqController.sendRFQ);
router.get('/:id/preview', rfqController.previewRFQ);
router.delete('/:id', rfqController.deleteRFQ);

export default router;
