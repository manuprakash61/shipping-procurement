import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as tenderService from './tender.service';

const CreateTenderSchema = z.object({
  quoteId: z.string().cuid(),
  termsAndCond: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
});

const UpdateTenderSchema = z.object({
  termsAndCond: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
});

export async function createTender(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateTenderSchema.parse(req.body);
    const tender = await tenderService.createTender({ ...data, companyId: req.user!.companyId });
    res.status(201).json(tender);
  } catch (err) {
    next(err);
  }
}

export async function listTenders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tenderService.getTenders(req.user!.companyId, req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTender(req: Request, res: Response, next: NextFunction) {
  try {
    const tender = await tenderService.getTender(req.params.id, req.user!.companyId);
    res.json(tender);
  } catch (err) {
    next(err);
  }
}

export async function issueTender(req: Request, res: Response, next: NextFunction) {
  try {
    const tender = await tenderService.issueTender(req.params.id, req.user!.companyId);
    res.json(tender);
  } catch (err) {
    next(err);
  }
}

export async function updateTender(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateTenderSchema.parse(req.body);
    const tender = await tenderService.updateTender(req.params.id, req.user!.companyId, data);
    res.json(tender);
  } catch (err) {
    next(err);
  }
}

export async function previewTender(req: Request, res: Response, next: NextFunction) {
  try {
    const tender = await tenderService.getTender(req.params.id, req.user!.companyId);
    res.setHeader('Content-Type', 'text/html');
    res.send(tender.documentHtml);
  } catch (err) {
    next(err);
  }
}
