import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import searchRoutes from './modules/search/search.routes';
import vendorRoutes from './modules/vendors/vendor.routes';
import rfqRoutes from './modules/rfq/rfq.routes';
import quoteRoutes from './modules/quotes/quote.routes';
import tenderRoutes from './modules/tenders/tender.routes';
import webhookRoutes from './modules/webhooks/sendgrid.routes';
import settingsRoutes from './modules/settings/settings.routes';
import { compareQuotes } from './modules/quotes/quote.controller';
import { requireAuth } from './middleware/auth';
import { startSearchWorker } from './modules/search/search.service';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/webhooks/sendgrid', webhookRoutes);
app.use('/api/settings', settingsRoutes);

// Quote comparison (nested under RFQ path)
app.get('/api/rfq/:rfqId/quotes/compare', requireAuth, compareQuotes);

// Error handler (must be last)
app.use(errorHandler);

// Start server + BullMQ worker
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  startSearchWorker();
  console.log('[BullMQ] Search worker started');
});

export default app;
