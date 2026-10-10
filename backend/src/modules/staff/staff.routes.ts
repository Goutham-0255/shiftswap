import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AppError } from '../../lib/AppError';
import { requireActor, type Actor } from '../../middleware/actor';
import { validate } from '../../middleware/validate';

const toDto = (s: { id: string; name: string; role: string; certifications: string }) => ({
  ...s,
  certifications: JSON.parse(s.certifications) as string[],
});

export const createStaffBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  certifications: z.array(z.string().trim().toUpperCase().min(1)).max(10).default([]),
});

// Next free staff id: S1..S8 in the seed, so a new person becomes S9, S10, ...
async function nextStaffId() {
  const ids = await prisma.staff.findMany({ where: { role: 'STAFF' }, select: { id: true } });
  const numbers = ids.map(({ id }) => Number(id.slice(1))).filter(Number.isInteger);
  return `S${Math.max(0, ...numbers) + 1}`;
}

export function staffRoutes() {
  const router = Router();

  // GET /api/staff: everyone, for the "acting as" picker.
  router.get('/', async (_req, res) => {
    const staff = await prisma.staff.findMany();
    // Staff before managers, then by number so S10 comes after S9 (not after S1).
    const order = (s: { id: string; role: string }) => [s.role === 'STAFF' ? 0 : 1, Number(s.id.slice(1))];
    staff.sort((x, y) => order(x)[0] - order(y)[0] || order(x)[1] - order(y)[1]);
    res.json({ data: staff.map(toDto) });
  });

  // POST /api/staff: a manager adds a new staff member (no shifts yet; they can claim open listings).
  router.post('/', requireActor, validate({ body: createStaffBody }), async (_req, res) => {
    const actor = res.locals.actor as Actor;
    if (actor.role !== 'MANAGER') throw AppError.forbidden('Only managers can add staff');

    const { name, certifications } = res.locals.body as z.infer<typeof createStaffBody>;
    const staff = await prisma.staff.create({
      data: {
        id: await nextStaffId(),
        name,
        role: 'STAFF',
        certifications: JSON.stringify([...new Set(certifications)]),
      },
    });
    res.status(201).json({ data: toDto(staff) });
  });

  return router;
}
