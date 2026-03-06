import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as quoteController from './quote.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// Mounted at /api/quotes
router.get('/', quoteController.listQuotes);
router.get('/:id', quoteController.getQuote);
router.patch('/:id/status', quoteController.updateQuoteStatus);
router.post('/:id/extract', quoteController.reExtractQuote);

export default router;
