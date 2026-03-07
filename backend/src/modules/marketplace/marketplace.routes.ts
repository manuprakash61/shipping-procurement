import { Router } from 'express';
import * as marketplaceController from './marketplace.controller';

const router = Router();

// Public: no auth required for browsing
router.get('/search', marketplaceController.search);

export default router;
