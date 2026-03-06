import { z } from 'zod';

export const CreateSearchSchema = z.object({
  query: z.string().min(2).max(500),
  region: z.string().max(100).optional(),
});
