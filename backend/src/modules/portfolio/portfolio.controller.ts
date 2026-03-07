import { Request, Response, NextFunction } from 'express';
import { CreateProductSchema, UpdateProductSchema } from './portfolio.schema';
import * as portfolioService from './portfolio.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateProductSchema.parse(req.body);
    const product = await portfolioService.createProduct(req.user!.companyId, data);
    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await portfolioService.listMyProducts(req.user!.companyId, req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateProductSchema.parse(req.body);
    const product = await portfolioService.updateProduct(req.params.id, req.user!.companyId, data);
    res.json(product);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await portfolioService.deleteProduct(req.params.id, req.user!.companyId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await portfolioService.togglePublish(req.params.id, req.user!.companyId);
    res.json(product);
  } catch (err) { next(err); }
}

export async function getCompanyPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await portfolioService.getCompanyProducts(req.params.companyId);
    res.json(result);
  } catch (err) { next(err); }
}
