import { z } from 'zod';

export const CreateRFQSchema = z.object({
  subject: z.string().min(3).max(200),
  bodyHtml: z.string().min(10),
  bodyText: z.string().min(10),
  deadline: z.string().datetime().optional(),
  searchSessionId: z.string().optional(),
});

export const SendRFQSchema = z.object({
  vendorIds: z.union([z.array(z.string().cuid()), z.literal('all')]),
});

export const UpdateRFQSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  bodyHtml: z.string().min(10).optional(),
  bodyText: z.string().min(10).optional(),
  deadline: z.string().datetime().optional().nullable(),
});
