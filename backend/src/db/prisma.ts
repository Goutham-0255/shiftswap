import { PrismaClient } from '@prisma/client';

// One shared client for the whole app; Prisma manages the connection internally.
export const prisma = new PrismaClient();
