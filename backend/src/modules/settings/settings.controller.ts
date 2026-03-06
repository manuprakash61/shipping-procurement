import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as settingsService from './settings.service';

const UpdateSettingsSchema = z.object({
  rfqTemplate: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
  sendgridApiKey: z.string().optional(),
  hunterApiKey: z.string().optional(),
});

const TestEmailSchema = z.object({
  email: z.string().email(),
});

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings(req.user!.companyId);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateSettingsSchema.parse(req.body);
    const settings = await settingsService.updateSettings(req.user!.companyId, data);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function testEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = TestEmailSchema.parse(req.body);
    await settingsService.testEmail(req.user!.companyId, email);
    res.json({ message: 'Test email sent successfully' });
  } catch (err) {
    next(err);
  }
}
