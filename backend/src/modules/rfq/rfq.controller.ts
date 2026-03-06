import { Request, Response, NextFunction } from 'express';
import { CreateRFQSchema, SendRFQSchema, UpdateRFQSchema } from './rfq.schema';
import * as rfqService from './rfq.service';

export async function createRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateRFQSchema.parse(req.body);
    const rfq = await rfqService.createRFQ({
      ...data,
      companyId: req.user!.companyId,
      userId: req.user!.userId,
    });
    res.status(201).json(rfq);
  } catch (err) {
    next(err);
  }
}

export async function listRFQs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await rfqService.getRFQs(req.user!.companyId, req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    const rfq = await rfqService.getRFQ(req.params.id, req.user!.companyId);
    res.json(rfq);
  } catch (err) {
    next(err);
  }
}

export async function updateRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateRFQSchema.parse(req.body);
    const rfq = await rfqService.updateRFQ(req.params.id, req.user!.companyId, data);
    res.json(rfq);
  } catch (err) {
    next(err);
  }
}

export async function sendRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    const { vendorIds } = SendRFQSchema.parse(req.body);
    const result = await rfqService.sendRFQ(req.params.id, req.user!.companyId, vendorIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function previewRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    const html = await rfqService.previewRFQ(req.params.id, req.user!.companyId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
}

export async function deleteRFQ(req: Request, res: Response, next: NextFunction) {
  try {
    await rfqService.deleteRFQ(req.params.id, req.user!.companyId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
