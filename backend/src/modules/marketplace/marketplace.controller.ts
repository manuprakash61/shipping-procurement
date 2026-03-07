import { Request, Response, NextFunction } from 'express';
import * as marketplaceService from './marketplace.service';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q = '', category, country, page, limit } = req.query as Record<string, string>;
    const result = await marketplaceService.searchMarketplace(q, {
      category,
      country,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
