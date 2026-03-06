import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as vendorService from './vendor.service';

const UpdateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
});

const AddEmailSchema = z.object({
  address: z.string().email(),
});

export async function getVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorService.getVendor(req.params.id, req.user!.companyId);
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

export async function updateVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateVendorSchema.parse(req.body);
    const vendor = await vendorService.updateVendor(req.params.id, req.user!.companyId, data);
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorService.triggerEmailVerification(req.params.id, req.user!.companyId);
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

export async function addEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = AddEmailSchema.parse(req.body);
    const email = await vendorService.addEmail(req.params.id, req.user!.companyId, address);
    res.status(201).json(email);
  } catch (err) {
    next(err);
  }
}

export async function getEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const emails = await vendorService.getVendorEmails(req.params.id, req.user!.companyId);
    res.json(emails);
  } catch (err) {
    next(err);
  }
}
