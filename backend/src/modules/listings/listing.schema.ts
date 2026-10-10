import { z } from 'zod';

export const createListingBody = z.object({ shiftId: z.string().trim().min(1) });

export const listingIdParams = z.object({ id: z.coerce.number().int().positive() });

export const listListingsQuery = z.object({ status: z.enum(['OPEN', 'CLAIMED']).default('OPEN') });
