import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as searchController from './search.controller';

const router = Router();

router.use(requireAuth);

router.post('/', searchController.createSearch);
router.get('/history', searchController.getHistory);
router.get('/:id', searchController.getSearch);
router.get('/:id/stream', searchController.streamSearch);
router.delete('/:id', searchController.deleteSearch);

export default router;
