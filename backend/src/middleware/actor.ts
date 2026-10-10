import type { RequestHandler } from 'express';
import { prisma } from '../db/prisma';
import { AppError } from '../lib/AppError';

export type Role = 'STAFF' | 'MANAGER';

export interface Actor {
  id: string;
  name: string;
  role: Role;
  certifications: string[];
}

// There is no login: the UI sends the chosen person in the X-Actor-Id header.
// This middleware is the one place a real auth check (e.g. JWT) would replace later.
export const requireActor: RequestHandler = async (req, res, next) => {
  const actorId = req.header('X-Actor-Id');
  if (!actorId) throw AppError.unauthorized();

  const staff = await prisma.staff.findUnique({ where: { id: actorId } });
  if (!staff) throw AppError.unauthorized(`Unknown person "${actorId}"`);

  const actor: Actor = {
    id: staff.id,
    name: staff.name,
    role: staff.role as Role,
    certifications: JSON.parse(staff.certifications),
  };
  res.locals.actor = actor;
  next();
};
