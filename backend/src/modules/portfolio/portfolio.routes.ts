import { Router } from 'express';
import { requireAuth, requireSupplier } from '../../middleware/auth';
import * as portfolioController from './portfolio.controller';

const router = Router();

// Public: get a supplier's published products
router.get('/company/:companyId', portfolioController.getCompanyPortfolio);

// Protected supplier-only routes
router.use(requireAuth, requireSupplier);
router.post('/', portfolioController.create);
router.get('/', portfolioController.list);
router.patch('/:id', portfolioController.update);
router.delete('/:id', portfolioController.remove);
router.patch('/:id/publish', portfolioController.publish);

export default router;
