import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
});