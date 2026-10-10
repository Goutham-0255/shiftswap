import { AppError } from '../../lib/AppError';
import type { Actor } from '../../middleware/actor';
import { listingRepository as repo, type ListingWithRelations } from './listing.repository';
import { assertTransition, type ListingAction } from './listing.stateMachine';
import { evaluateClaim, evaluateLabourRules, type ClaimContext, type Violation } from './rules';

// Business logic for the listing workflow. No HTTP here: controllers call these
// functions, and every refusal is an AppError with all the reasons attached.

function requireStaff(actor: Actor) {
  if (actor.role !== 'STAFF') throw AppError.forbidden('Managers cannot post or claim shifts');
}

function requireManager(actor: Actor) {
  if (actor.role !== 'MANAGER') throw AppError.forbidden('Only managers can approve or reject');
}

async function getListing(id: number) {
  const listing = await repo.findListing(id);
  if (!listing) throw AppError.notFound(`Listing ${id} not found`);
  return listing;
}

// Loads everything the rules need, so the rules themselves stay pure.
async function buildClaimContext(claimerId: string, certifications: string[], listing: ListingWithRelations) {
  const context: ClaimContext = {
    claimerId,
    claimerCertifications: certifications,
    shift: listing.shift,
    claimerShifts: await repo.shiftsAssignedTo(claimerId), // pending claims don't count
  };
  return context;
}

// Runs an action and writes a history entry whether it succeeds or is refused.
async function audited<T>(
  actor: Actor,
  action: ListingAction,
  target: { shiftId: string; listingId?: number },
  run: () => Promise<T>,
): Promise<T> {
  try {
    const result = await run();
    await repo.addHistory({ actorId: actor.id, action, ...target, outcome: 'SUCCESS' });
    return result;
  } catch (err) {
    if (err instanceof AppError) {
      const reasons = Array.isArray(err.details) ? err.details : [{ message: err.message }];
      await repo.addHistory({ actorId: actor.id, action, ...target, outcome: 'REFUSED', reasons });
    }
    throw err;
  }
}

export const listingService = {
  async post(actor: Actor, shiftId: string) {
    const shift = await repo.findShift(shiftId);
    if (!shift) throw AppError.notFound(`Shift ${shiftId} not found`);

    return audited(actor, 'POST', { shiftId }, async () => {
      requireStaff(actor);
      if (shift.assignedToId !== actor.id) throw AppError.forbidden('You can only post your own shifts');
      if (await repo.findActiveListingForShift(shiftId)) {
        throw AppError.conflict('This shift already has an open or claimed listing');
      }
      return repo.create(shiftId, actor.id);
    });
  },

  async withdraw(actor: Actor, listingId: number) {
    const listing = await getListing(listingId);
    return audited(actor, 'WITHDRAW', { shiftId: listing.shiftId, listingId }, async () => {
      if (listing.posterId !== actor.id) throw AppError.forbidden('Only the poster can withdraw this listing');
      const { from, to } = assertTransition('WITHDRAW', listing.status);
      if (!(await repo.updateIfStatus(listingId, from, { status: to }))) {
        throw AppError.conflict('Listing changed in the meantime, please refresh');
      }
    });
  },

  async claim(actor: Actor, listingId: number) {
    const listing = await getListing(listingId);
    return audited(actor, 'CLAIM', { shiftId: listing.shiftId, listingId }, async () => {
      requireStaff(actor);
      // If the listing is not OPEN: "no longer available" and nothing else is checked.
      const { from, to } = assertTransition('CLAIM', listing.status);

      const violations = evaluateClaim(await buildClaimContext(actor.id, actor.certifications, listing));
      if (violations.length > 0) throw AppError.ruleViolation('You cannot claim this shift', violations);

      // Guarded update: if two people claim at the same moment, only one succeeds.
      if (!(await repo.updateIfStatus(listingId, from, { status: to, claimerId: actor.id }))) {
        throw AppError.conflict('This listing is no longer available');
      }
    });
  },

  async unclaim(actor: Actor, listingId: number) {
    const listing = await getListing(listingId);
    return audited(actor, 'UNCLAIM', { shiftId: listing.shiftId, listingId }, async () => {
      if (listing.claimerId !== actor.id) throw AppError.forbidden('Only the claimer can unclaim this listing');
      const { from, to } = assertTransition('UNCLAIM', listing.status);
      if (!(await repo.updateIfStatus(listingId, from, { status: to, claimerId: null }))) {
        throw AppError.conflict('Listing changed in the meantime, please refresh');
      }
    });
  },

  async approve(actor: Actor, listingId: number) {
    const listing = await getListing(listingId);
    return audited(actor, 'APPROVE', { shiftId: listing.shiftId, listingId }, async () => {
      requireManager(actor);
      assertTransition('APPROVE', listing.status);
      const claimer = listing.claimer!;

      // Re-check rules 2 to 5 against the claimer's assignments as they are now.
      // On failure the listing stays CLAIMED.
      const context = await buildClaimContext(claimer.id, JSON.parse(claimer.certifications), listing);
      const violations = evaluateLabourRules(context);
      if (violations.length > 0) throw AppError.ruleViolation('Cannot approve this claim', violations);

      if (!(await repo.approve({ id: listingId, shiftId: listing.shiftId, claimerId: claimer.id }))) {
        throw AppError.conflict('Listing changed in the meantime, please refresh');
      }
    });
  },

  async reject(actor: Actor, listingId: number) {
    const listing = await getListing(listingId);
    return audited(actor, 'REJECT', { shiftId: listing.shiftId, listingId }, async () => {
      requireManager(actor);
      const { from, to } = assertTransition('REJECT', listing.status);
      if (!(await repo.updateIfStatus(listingId, from, { status: to, claimerId: null }))) {
        throw AppError.conflict('Listing changed in the meantime, please refresh');
      }
    });
  },

  // OPEN listings posted by other people, each with "can I claim it, and if not why".
  async openListingsFor(actor: Actor) {
    const listings = await repo.listByStatus('OPEN');
    const myShifts = await repo.shiftsAssignedTo(actor.id);

    return listings
      .filter((listing) => listing.posterId !== actor.id)
      .map((listing) => {
        const reasons: Violation[] =
          actor.role === 'STAFF'
            ? evaluateClaim({
                claimerId: actor.id,
                claimerCertifications: actor.certifications,
                shift: listing.shift,
                claimerShifts: myShifts,
              })
            : [{ rule: 1, message: 'Managers cannot claim shifts' }];
        return { ...listing, canClaim: reasons.length === 0, reasons };
      });
  },

  // CLAIMED listings, each with "would approval pass right now, and if not why",
  // using the same rules 2 to 5 that approve() re-checks.
  async claimedListings() {
    const listings = await repo.listByStatus('CLAIMED');
    return Promise.all(
      listings.map(async (listing) => {
        const claimer = listing.claimer!;
        const context = await buildClaimContext(claimer.id, JSON.parse(claimer.certifications), listing);
        const reasons = evaluateLabourRules(context);
        return { ...listing, canApprove: reasons.length === 0, reasons };
      }),
    );
  },
};
