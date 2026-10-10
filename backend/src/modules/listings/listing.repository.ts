import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { ACTIVE_STATUSES, type ListingAction, type ListingStatus } from './listing.stateMachine';

// The only file in the listings module that talks to the database.

const listingInclude = {
  shift: true,
  poster: { select: { id: true, name: true } },
  claimer: { select: { id: true, name: true, certifications: true } },
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

export const listingRepository = {
  findShift: (id: string) => prisma.shift.findUnique({ where: { id } }),

  findStaff: (id: string) => prisma.staff.findUnique({ where: { id } }),

  shiftsAssignedTo: (staffId: string) => prisma.shift.findMany({ where: { assignedToId: staffId } }),

  findListing: (id: number) => prisma.listing.findUnique({ where: { id }, include: listingInclude }),

  findActiveListingForShift: (shiftId: string) =>
    prisma.listing.findFirst({ where: { shiftId, status: { in: ACTIVE_STATUSES } } }),

  listByStatus: (status: ListingStatus) =>
    prisma.listing.findMany({ where: { status }, include: listingInclude, orderBy: { shift: { start: 'asc' } } }),

  create: (shiftId: string, posterId: string) =>
    prisma.listing.create({ data: { shiftId, posterId, status: 'OPEN' }, include: listingInclude }),

  // Optimistic concurrency: only update if the listing is still in the status we read.
  // Returns false when someone else changed it first (two clicks at the same moment).
  async updateIfStatus(id: number, from: ListingStatus, data: Prisma.ListingUncheckedUpdateInput) {
    const { count } = await prisma.listing.updateMany({ where: { id, status: from }, data });
    return count === 1;
  },

  // Approval changes two tables, so it runs in one transaction: all or nothing.
  approve: (listing: { id: number; shiftId: string; claimerId: string }) =>
    prisma.$transaction(async (tx) => {
      const { count } = await tx.listing.updateMany({
        where: { id: listing.id, status: 'CLAIMED', claimerId: listing.claimerId },
        data: { status: 'APPROVED' },
      });
      if (count !== 1) return false;
      await tx.shift.update({ where: { id: listing.shiftId }, data: { assignedToId: listing.claimerId } });
      return true;
    }),

  addHistory: (entry: {
    actorId: string;
    action: ListingAction;
    shiftId: string;
    listingId?: number;
    outcome: 'SUCCESS' | 'REFUSED';
    reasons?: unknown[];
  }) =>
    prisma.historyEntry.create({
      data: { ...entry, reasons: JSON.stringify(entry.reasons ?? []) },
    }),
};
