import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as settingsController from './settings.controller';

const router = Router();

router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.post('/test-email', settingsController.testEmail);

export default router;
