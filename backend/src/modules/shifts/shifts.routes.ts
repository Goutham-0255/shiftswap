import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { requireActor, type Actor } from '../../middleware/actor';
import { ACTIVE_STATUSES } from '../listings/listing.stateMachine';

export function shiftsRoutes() {
  const router = Router();

  // GET /api/shifts/mine: the actor's shifts, each with its OPEN/CLAIMED listing if it has one.
  router.get('/mine', requireActor, async (_req, res) => {
    const actor = res.locals.actor as Actor;
    const shifts = await prisma.shift.findMany({
      where: { assignedToId: actor.id },
      orderBy: { start: 'asc' },
      include: {
        listings: {
          where: { status: { in: ACTIVE_STATUSES } },
          include: { claimer: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({ data: shifts.map(({ listings, ...shift }) => ({ ...shift, activeListing: listings[0] ?? null })) });
  });

  return router;
}
