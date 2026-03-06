import { Router } from 'express';
import * as sendgridController from './sendgrid.controller';

const router = Router();

// SendGrid webhooks — no JWT auth (secured by shared secret or IP allowlist in prod)
router.post('/inbound', sendgridController.handleInboundEmail);
router.post('/events', sendgridController.handleSendgridEvent);

export default router;
