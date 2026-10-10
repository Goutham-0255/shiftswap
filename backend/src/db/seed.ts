import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';

interface SeedFile {
  staff: { id: string; name: string; role: string; certifications: string[] }[];
  shifts: {
    id: string;
    start: string;
    end: string;
    required_certification: string | null;
    assigned_to: string;
  }[];
}

const SEED_PATH = path.join(__dirname, '../../data/seed.json');

// Loads seed.json only when the database has no saved state (no staff yet),
// so restarting the backend never overwrites existing data.
export async function seedIfEmpty() {
  if ((await prisma.staff.count()) > 0) return;

  const seed: SeedFile = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));

  // One transaction: either the whole seed is loaded or nothing is.
  await prisma.$transaction([
    prisma.staff.createMany({
      data: seed.staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        certifications: JSON.stringify(s.certifications),
      })),
    }),
    prisma.shift.createMany({
      data: seed.shifts.map((s) => ({
        id: s.id,
        start: s.start,
        end: s.end,
        requiredCertification: s.required_certification,
        assignedToId: s.assigned_to,
      })),
    }),
  ]);

  console.log(`Seeded ${seed.staff.length} staff and ${seed.shifts.length} shifts`);
}
