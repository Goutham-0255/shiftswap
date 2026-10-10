import { Router } from 'express';
import { prisma } from '../../db/prisma';

// GET /api/staff: everyone, for the "acting as" picker.
export function staffRoutes() {
  const router = Router();

  router.get('/', async (_req, res) => {
    const staff = await prisma.staff.findMany({ orderBy: [{ role: 'desc' }, { id: 'asc' }] });
    res.json({ data: staff.map((s) => ({ ...s, certifications: JSON.parse(s.certifications) as string[] })) });
  });

  return router;
}
