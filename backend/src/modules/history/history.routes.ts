import { Router } from 'express';
import { prisma } from '../../db/prisma';

// GET /api/history: every action (who, what, which shift, outcome), newest first.
export function historyRoutes() {
  const router = Router();

  router.get('/', async (_req, res) => {
    const entries = await prisma.historyEntry.findMany({
      orderBy: { id: 'desc' },
      take: 200,
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
    res.json({ data: entries.map((e) => ({ ...e, reasons: JSON.parse(e.reasons) as unknown[] })) });
  });

  return router;
}
