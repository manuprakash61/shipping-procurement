import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as quoteService from './quote.service';

const UpdateStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'ACCEPTED']),
});

export async function listQuotes(req: Request, res: Response, next: NextFunction) {
  try {
    const rfqId = req.query.rfqId as string | undefined;
    const result = await quoteService.getQuotes(req.user!.companyId, rfqId, req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quoteService.getQuote(req.params.id, req.user!.companyId);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function updateQuoteStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = UpdateStatusSchema.parse(req.body);
    const quote = await quoteService.updateQuoteStatus(req.params.id, req.user!.companyId, status);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function reExtractQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quoteService.reExtractQuote(req.params.id, req.user!.companyId);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function compareQuotes(req: Request, res: Response, next: NextFunction) {
  try {
    const quotes = await quoteService.getComparisonData(req.params.rfqId, req.user!.companyId);
    res.json(quotes);
  } catch (err) {
    next(err);
  }
}
