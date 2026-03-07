import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(100),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  minOrderQty: z.number().int().positive().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  certifications: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial();
