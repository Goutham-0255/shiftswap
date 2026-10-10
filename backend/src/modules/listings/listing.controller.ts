import type { Request, Response } from 'express';
import type { Actor } from '../../middleware/actor';
import { listingRepository } from './listing.repository';
import { listingService } from './listing.service';

// Controllers translate HTTP <-> service calls and stay thin on purpose.

const actorOf = (res: Response) => res.locals.actor as Actor;
const idOf = (res: Response) => (res.locals.params as { id: number }).id;

async function sendListing(res: Response, id: number, status = 200) {
  res.status(status).json({ data: await listingRepository.findListing(id) });
}

type Action = 'withdraw' | 'claim' | 'unclaim' | 'approve' | 'reject';

export const listingController = {
  async list(_req: Request, res: Response) {
    const { status } = res.locals.query as { status: 'OPEN' | 'CLAIMED' };
    const data =
      status === 'OPEN' ? await listingService.openListingsFor(actorOf(res)) : await listingService.claimedListings();
    res.json({ data });
  },

  async create(_req: Request, res: Response) {
    const { shiftId } = res.locals.body as { shiftId: string };
    const listing = await listingService.post(actorOf(res), shiftId);
    await sendListing(res, listing.id, 201);
  },

  // One handler per state-machine action: POST /api/listings/:id/<action>
  action: (name: Action) => async (_req: Request, res: Response) => {
    await listingService[name](actorOf(res), idOf(res));
    await sendListing(res, idOf(res));
  },
};
